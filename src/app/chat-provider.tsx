'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  serverTimestamp,
  doc,
  deleteDoc
} from 'firebase/firestore';

interface ChatMessage {
  id: string;
  senderName: string;
  deviceId: string;
  text: string;
  createdAt: any;
}

interface ChatContextType {
  groupCode: string;
  userName: string;
  deviceId: string;
  isInGroup: boolean;
  messages: ChatMessage[];
  unreadCount: number;
  activeMembersCount: number;
  isLoading: boolean;
  joinGroup: (code: string, name: string) => void;
  leaveGroup: () => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  markChatAsRead: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [groupCode, setGroupCode] = useState('');
  const [userName, setUserName] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [isInGroup, setIsInGroup] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeMembersCount, setActiveMembersCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [lastReadTime, setLastReadTime] = useState<string>('');

  const unsubMessagesRef = useRef<(() => void) | null>(null);
  const unsubMembersRef = useRef<(() => void) | null>(null);

  // Initialize from LocalStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedGroup = localStorage.getItem('umre_family_group_code') || '';
    const savedName = localStorage.getItem('umre_family_name') || '';
    let savedDeviceId = localStorage.getItem('umre_family_device_id') || '';
    const savedLastRead = localStorage.getItem('umre_family_last_read_time') || '';

    if (!savedDeviceId) {
      savedDeviceId = 'dev_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('umre_family_device_id', savedDeviceId);
    }

    setGroupCode(savedGroup);
    setUserName(savedName);
    setDeviceId(savedDeviceId);
    setLastReadTime(savedLastRead || new Date().toISOString());
    setIsInGroup(!!(savedGroup && savedName));
    setIsLoading(false);
  }, []);

  // Listen to messages & members when in group
  useEffect(() => {
    if (!isInGroup || !groupCode) {
      setMessages([]);
      setUnreadCount(0);
      setActiveMembersCount(0);
      if (unsubMessagesRef.current) {
        unsubMessagesRef.current();
        unsubMessagesRef.current = null;
      }
      if (unsubMembersRef.current) {
        unsubMembersRef.current();
        unsubMembersRef.current = null;
      }
      return;
    }

    // 1. Subscribe to Messages
    const msgCollectionRef = collection(db, 'groups', groupCode, 'messages');
    const q = query(msgCollectionRef, orderBy('createdAt', 'asc'));

    unsubMessagesRef.current = onSnapshot(q, (snapshot) => {
      const msgList: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        msgList.push({
          id: doc.id,
          senderName: data.senderName || '',
          deviceId: data.deviceId || '',
          text: data.text || '',
          createdAt: data.createdAt,
        });
      });
      setMessages(msgList);
    }, (err) => {
      console.warn('Real-time messages listener error:', err);
    });

    // 2. Subscribe to Members
    const membersCollectionRef = collection(db, 'groups', groupCode, 'members');
    unsubMembersRef.current = onSnapshot(membersCollectionRef, (snapshot) => {
      setActiveMembersCount(snapshot.size);
    }, (err) => {
      console.warn('Real-time members listener error:', err);
    });

    return () => {
      if (unsubMessagesRef.current) {
        unsubMessagesRef.current();
        unsubMessagesRef.current = null;
      }
      if (unsubMembersRef.current) {
        unsubMembersRef.current();
        unsubMembersRef.current = null;
      }
    };
  }, [isInGroup, groupCode]);

  // Calculate unreadCount whenever messages or lastReadTime changes
  useEffect(() => {
    if (!isInGroup || messages.length === 0 || !lastReadTime) {
      setUnreadCount(0);
      return;
    }

    const lastReadMs = new Date(lastReadTime).getTime();
    let count = 0;

    messages.forEach((msg) => {
      // Exclude our own messages
      if (msg.deviceId === deviceId) return;

      const msgTimeMs = msg.createdAt && msg.createdAt.seconds 
        ? msg.createdAt.seconds * 1000 
        : msg.createdAt ? new Date(msg.createdAt).getTime() : Date.now();

      if (msgTimeMs > lastReadMs) {
        count++;
      }
    });

    setUnreadCount(count);
  }, [messages, lastReadTime, deviceId, isInGroup]);

  const joinGroup = (code: string, name: string) => {
    const cleanGroup = code.toUpperCase().trim();
    const cleanName = name.trim();
    const nowStr = new Date().toISOString();

    setGroupCode(cleanGroup);
    setUserName(cleanName);
    setIsInGroup(true);
    setLastReadTime(nowStr);

    localStorage.setItem('umre_family_group_code', cleanGroup);
    localStorage.setItem('umre_family_name', cleanName);
    localStorage.setItem('umre_family_last_read_time', nowStr);
  };

  const leaveGroup = async () => {
    if (!groupCode || !deviceId) return;

    // Remove from Firestore members
    try {
      const memberRef = doc(db, 'groups', groupCode, 'members', deviceId);
      await deleteDoc(memberRef);
    } catch (err) {
      console.warn('Could not remove member from Firestore:', err);
    }

    // Clean up local state
    setGroupCode('');
    setUserName('');
    setIsInGroup(false);
    setMessages([]);
    setUnreadCount(0);
    setActiveMembersCount(0);

    localStorage.removeItem('umre_family_group_code');
    localStorage.removeItem('umre_family_name');
    localStorage.removeItem('umre_family_last_read_time');
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || !groupCode || !deviceId || !userName) return;

    try {
      const messagesRef = collection(db, 'groups', groupCode, 'messages');
      await addDoc(messagesRef, {
        senderName: userName,
        deviceId,
        text: text.trim(),
        createdAt: serverTimestamp(),
      });
      
      // Instantly mark our own new message time as read
      const nowStr = new Date().toISOString();
      setLastReadTime(nowStr);
      localStorage.setItem('umre_family_last_read_time', nowStr);
    } catch (err) {
      console.warn('Failed to send message:', err);
    }
  };

  const markChatAsRead = () => {
    const nowStr = new Date().toISOString();
    setLastReadTime(nowStr);
    localStorage.setItem('umre_family_last_read_time', nowStr);
    setUnreadCount(0);
  };

  return (
    <ChatContext.Provider
      value={{
        groupCode,
        userName,
        deviceId,
        isInGroup,
        messages,
        unreadCount,
        activeMembersCount,
        isLoading,
        joinGroup,
        leaveGroup,
        sendMessage,
        markChatAsRead,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
