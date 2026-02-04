import React from 'react';
import { Edit, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

import { User } from 'firebase/auth';

interface ProfileTabProps {
    user: User | null;
    setShowEditProfile: (v: boolean) => void;
    onLogout: () => void;
}

const ProfileTab: React.FC<ProfileTabProps> = ({
    user,
    setShowEditProfile,
    onLogout
}) => {
    return (
        <div className="p-5 flex flex-col h-full animate-fade">
            <h2 className="text-3xl font-bold text-white mb-8">My Profile</h2>
            <Card className="bg-white rounded-3xl overflow-hidden shadow-xl border-none">
                <CardHeader className="flex flex-col items-center pt-10 pb-6 bg-gradient-to-b from-gray-50 to-white">
                    <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-amber-400 text-3xl font-bold text-black uppercase">
                            {(user?.displayName || 'G')[0]}
                        </AvatarFallback>
                    </Avatar>
                    <CardTitle className="mt-4 text-2xl font-bold">{user?.displayName || 'Guest User'}</CardTitle>
                    <CardDescription className="text-gray-500">{user?.email || 'guest@example.com'}</CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className="p-6 space-y-4">
                    <Button
                        variant="outline"
                        onClick={() => setShowEditProfile(true)}
                        className="w-full h-14 rounded-2xl text-lg font-bold border-gray-200 hover:bg-gray-50 gap-3"
                    >
                        <Edit size={20} /> Edit Profile
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onLogout}
                        className="w-full h-14 rounded-2xl text-lg font-bold gap-3"
                    >
                        <LogOut size={20} /> Logout
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default ProfileTab;
