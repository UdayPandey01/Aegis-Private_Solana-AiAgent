"use client";

import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import axios from 'axios';
import bs58 from 'bs58';

export const CustomWalletButton = () => {
  const { wallet, connect, connected, publicKey, disconnect, signMessage } = useWallet();
  const { setVisible } = useWalletModal();
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (connected && publicKey && !isAuthenticated && !isLoading) {
      handleSignIn();
    }
  }, [connected, publicKey, isAuthenticated]);

  const handleSignIn = async () => {
    if (!publicKey || !signMessage) return;
    setIsLoading(true);
    try {
      const { data: { message } } = await axios.post('http://localhost:3001/auth/request-message', {
        publicKey: publicKey.toBase58(),
      });

      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = await signMessage(messageBytes);
      const signature = bs58.encode(signatureBytes);

      const { data: { token } } = await axios.post('http://localhost:3001/auth/login', {
        publicKey: publicKey.toBase58(),
        signature,
      });

      localStorage.setItem('session-token', token);
      setIsAuthenticated(true);
      console.log("Sign-in successful!");

    } catch (error) {
      console.error("Sign-in failed:", error);
      disconnect();
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) {
    return null;
  }

  if (!wallet) {
    return (
      <Button
        onClick={() => setVisible(true)}
        className="font-sans bg-white text-black hover:bg-slate-200 transition-colors"
      >
        Select Wallet
      </Button>
    );
  }
  if (!connected) {
    return (
      <Button
        onClick={() => connect().catch(() => {})}
        className="font-sans bg-white text-black hover:bg-slate-200 transition-colors"
        disabled={isLoading}
      >
        Connect Wallet
      </Button>
    );
  }
  
  if (isLoading) {
      return (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-neutral-900 border border-white/10">
              <span className="font-sans text-sm text-slate-400">Verifying...</span>
          </div>
      );
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-neutral-900 border border-white/10">
        <Wallet className="h-4 w-4 text-white" />
        <span className="font-sans text-sm text-slate-300">
          {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
        </span>
        <Button 
          onClick={() => { 
            localStorage.removeItem('session-token');
            setIsAuthenticated(false); 
            disconnect(); 
          }} 
          variant="ghost" 
          size="sm" 
          className="ml-2 text-slate-400 hover:text-white h-auto p-1"
        >
          Logout
        </Button>
      </div>
    );
  }
  
  return (
    <div className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-neutral-900 border border-white/10">
        <span className="font-sans text-sm text-slate-400">Please sign message...</span>
    </div>
  );
};