"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
}

export default function Home() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [idea, setIdea] = useState<string>('…loading');

    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            router.push('/auth/signin');
            return;
        }

        const verifyToken = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/session?token=${token}`);
                if (!response.ok) {
                    throw new Error('Invalid token');
                }
                const data = await response.json();
                setUser(data.user);
            } catch (error) {
                localStorage.removeItem('auth_token');
                router.push('/auth/signin');
            } finally {
                setLoading(false);
            }
        };

        verifyToken();
    }, [router]);

    useEffect(() => {
        if (user) {
            const evt = new EventSource('/api');
            let buffer = '';

            evt.onmessage = (e) => {
                buffer += e.data;
                setIdea(buffer);
            };
            evt.onerror = () => {
                console.error('SSE error, closing');
                evt.close();
            };

            return () => { evt.close(); };
        }
    }, [user]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
                <div className="animate-pulse text-gray-400">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        router.push('/auth/signin');
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            <div className="container mx-auto px-4 py-12">
                {/* Header */}
                <header className="flex items-center justify-between mb-12">
                    <div className="text-center flex-1">
                        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                            Business Idea Generator
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 text-lg">
                            AI-powered innovation at your fingertips
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Welcome back</p>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">{user.name}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
                        >
                            Sign Out
                        </button>
                    </div>
                </header>

                {/* Content Card */}
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 backdrop-blur-lg bg-opacity-95">
                        {idea === '…loading' ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-pulse text-gray-400">
                                    Generating your business idea...
                                </div>
                            </div>
                        ) : (
                            <div className="markdown-content text-gray-700 dark:text-gray-300">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm, remarkBreaks]}
                                >
                                    {idea}
                                </ReactMarkdown>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
