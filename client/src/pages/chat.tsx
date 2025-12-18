import { useApp } from "@/lib/store";
import { ChatWindow } from "@/components/chat/ChatWindow";

export default function UserChat() {
    // Admin is assumed to be ID 1. In a real app, you might have multiple admins or a specific support user.
    const { users } = useApp();
    // Dynamically find admin user
    const adminUser = users.find(u => u.role === 'admin');
    const adminId = adminUser ? adminUser.id : '1';

    return (
        <div className="h-[calc(100vh-100px)] py-6">
            <div className="h-full max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold tracking-tight mb-6">Support Chat</h1>
                <ChatWindow
                    otherUserId={adminId}
                    // Name could be fetched, but statically 'Administrator' is fine for user view
                    otherUserName="Administrator"
                    className="h-[600px]"
                />
            </div>
        </div>
    );
}
