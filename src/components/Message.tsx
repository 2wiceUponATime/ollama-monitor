import { ChatMessage, Status } from "@/utils/types";

const roles = {
    'user': { name: 'User', color: 'bg-blue-100 text-blue-800' },
    'assistant': { name: 'Assistant', color: 'bg-green-100 text-green-800' },
    'system': { name: 'System', color: 'bg-purple-100 text-purple-800' },
    'tool': { name: 'Tool', color: 'bg-orange-100 text-orange-800' },
}

function Circle() {
    return (
        <span className="inline-block w-2 h-4 bg-gray-400 ml-1 animate-pulse rounded-sm"></span>
    );
}

export default function Message({ message, status }: { message: ChatMessage, status: Status }) {
    const thinking = (message.thinking || '').trim();
    const content = message.content.trim();
    const role = roles[message.role];
    
    return (
        <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
            {/* Header */}
            <div className={`px-4 py-2 ${role.color} border-b border-gray-200`}>
                <div className="font-semibold text-sm">{role.name}</div>
            </div>
            
            {/* Content */}
            <div className="p-4 bg-white">
                {/* Thinking section */}
                {thinking && (
                    <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <span className="text-sm font-medium text-yellow-800">Thinking</span>
                        </div>
                        <div className="text-sm text-yellow-700 whitespace-pre-wrap font-mono">
                            {thinking}
                            {status === 'thinking' && <Circle />}
                        </div>
                    </div>
                )}
                
                {/* Main content */}
                <div className="whitespace-pre-wrap text-gray-800">
                    {content || (
                        <span className="text-gray-500 italic">Empty message</span>
                    )}
                    {status === 'responding' && <Circle />}
                </div>
                
                {/* Tool calls */}
                {message.tool_calls && message.tool_calls.length > 0 && (
                    <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-700">Tool Calls</span>
                        </div>
                        <div className="space-y-2">
                            {message.tool_calls.map((tool_call, index) => (
                                <div key={index} className="text-sm font-mono text-gray-600 bg-white p-2 rounded border">
                                    <div className="font-semibold text-gray-800">{tool_call.function.name}</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {JSON.stringify(tool_call.function.arguments, null, 2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}