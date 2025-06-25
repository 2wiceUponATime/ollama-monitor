"use client";

import { useEffect, useState } from "react";
import { ChatMessage } from "@/utils/types";
import ChatResponse from "@/components/ChatResponse";
import "./page.css";

const roleMap: Record<ChatMessage["role"], string> = {
    "user": "User",
    "assistant": "Assistant",
    "system": "System",
    "tool": "Tool",
}

function stringifyMessage(message: ChatMessage) {
    return `${roleMap[message.role]}: ${message.content}`;
}

function RecentItem({id}: {id: string}) {
    const [data, setData] = useState<{model: string, message: ChatMessage} | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        async function getData() {
            try {
                setLoading(true);
                setError(null);
                const response = await fetch(`/api/monitor/request?id=${id}`);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                const data = await response.json();
                setData({model: data.model, message: data.messages.at(-1)});
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load data');
            } finally {
                setLoading(false);
            }
        }
        getData();
    }, [id]);

    if (error) {
        return (
            <tr>
                <td colSpan={3} className="text-red-500 p-2">
                    Error loading {id}: {error}
                </td>
            </tr>
        );
    }

    return (
        <>
            <tr 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <td className="flex items-center gap-2">
                    <span className="text-gray-400">
                        {isExpanded ? '▼' : '▶'}
                    </span>
                    {id}
                </td>
                <td>{loading ? "Loading..." : data?.model ?? "Unknown"}</td>
                <td>{loading ? "Loading..." : data?.message ? stringifyMessage(data.message) : "No message"}</td>
            </tr>
            {isExpanded && (
                <tr>
                    <td colSpan={3} className="p-4 bg-gray-50">
                        <div className="border rounded-lg bg-white p-4">
                            <ChatResponse id={id} />
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

export default function Monitor() {
    const [recent, setRecent] = useState<string[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function getRecent() {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch("/api/monitor/recent");
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            setRecent(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load recent requests');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        getRecent();
        
        // Auto-refresh every 30 seconds
        const interval = setInterval(getRecent, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen p-4">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    <span className="ml-2">Loading recent requests...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen p-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h2 className="text-red-800 font-semibold">Error</h2>
                    <p className="text-red-600">{error}</p>
                    <button 
                        onClick={getRecent}
                        className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Recent Requests</h1>
                <button 
                    onClick={getRecent}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Refresh
                </button>
            </div>
            
            {recent?.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                    No recent requests found
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="border border-gray-300 p-2 text-left">ID</th>
                                <th className="border border-gray-300 p-2 text-left">Model</th>
                                <th className="border border-gray-300 p-2 text-left">Message</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recent?.map((item) => (
                                <RecentItem key={item} id={item} />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}