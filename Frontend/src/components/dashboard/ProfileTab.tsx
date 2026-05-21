import React from 'react';
import { Edit, LogOut, Leaf, Wheat, Target, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

import { User as FirebaseUser } from 'firebase/auth';
import { FoodProfile, Allergen } from '@/types/dashboard';
import { UserBodyMetrics, NutritionGoals } from '@/types/nutritionGoals';

interface ProfileTabProps {
    user: FirebaseUser | null;
    userDataLoading?: boolean;
    phoneNumber?: string;
    foodProfile?: FoodProfile;
    bodyMetrics?: UserBodyMetrics | null;
    nutritionGoals?: NutritionGoals | null;
    setShowEditProfile: (v: boolean) => void;
    setShowEditFoodProfile: (v: boolean) => void;
    onLogout: () => void;
    onNavigateToMealLog?: () => void;
}

const ProfileTab: React.FC<ProfileTabProps> = ({
    user,
    userDataLoading = false,
    phoneNumber,
    foodProfile,
    bodyMetrics,
    nutritionGoals,
    setShowEditProfile,
    setShowEditFoodProfile,
    onLogout,
    onNavigateToMealLog
}) => {
    const hasDietaryPreferences = foodProfile?.isVegetarian || foodProfile?.isVegan || foodProfile?.isGlutenFree;
    const hasAllergens = foodProfile?.allergens && foodProfile.allergens.length > 0;
    const hasBodyMetrics = bodyMetrics && (bodyMetrics.age || bodyMetrics.weightKg || bodyMetrics.heightCm);
    const hasGoals = nutritionGoals !== null;

    return (
        <div className="p-5 flex flex-col h-full animate-fade overflow-y-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h2>
            {userDataLoading ? (
                <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                </div>
            ) : (
            <Card className="bg-white rounded-3xl shadow-xl border-none flex-shrink-0">
                <CardHeader className="flex flex-col items-center pt-10 pb-6 bg-gradient-to-b from-gray-50 to-white">
                    <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-amber-400 text-3xl font-bold text-black uppercase">
                            {(user?.displayName || 'G')[0]}
                        </AvatarFallback>
                    </Avatar>
                    <CardTitle className="mt-4 text-2xl font-bold">{user?.displayName || 'Guest User'}</CardTitle>
                    <CardDescription className="text-gray-500">{user?.email || 'guest@example.com'}</CardDescription>
                    {phoneNumber && <CardDescription className="text-gray-400 font-medium">{phoneNumber}</CardDescription>}
                </CardHeader>
                <Separator />

                <CardContent className="p-6 space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Dietary Preferences</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {foodProfile?.isVegetarian && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                                    <Leaf size={14} /> Vegetarian
                                </span>
                            )}
                            {foodProfile?.isVegan && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                                    🌱 Vegan
                                </span>
                            )}
                            {foodProfile?.isGlutenFree && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-sm font-medium">
                                    <Wheat size={14} /> Gluten-Free
                                </span>
                            )}
                            {!hasDietaryPreferences && (
                                <span className="text-gray-400 text-sm">No preferences set</span>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {(hasBodyMetrics || hasGoals) && (
                        <>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Body & Goals</h3>
                                </div>
                                {hasBodyMetrics && (
                                    <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                                        {bodyMetrics?.age && <span className="px-2 py-1 bg-gray-100 rounded-lg">{bodyMetrics.age} yr</span>}
                                        {bodyMetrics?.weightKg && <span className="px-2 py-1 bg-gray-100 rounded-lg">{bodyMetrics.weightKg} kg</span>}
                                        {bodyMetrics?.heightCm && <span className="px-2 py-1 bg-gray-100 rounded-lg">{bodyMetrics.heightCm} cm</span>}
                                        {bodyMetrics?.activityLevel && (
                                            <span className="px-2 py-1 bg-gray-100 rounded-lg capitalize">
                                                {bodyMetrics.activityLevel.replace('_', ' ')}
                                            </span>
                                        )}
                                    </div>
                                )}
                                {hasGoals && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Target size={16} className="text-amber-500" />
                                        <span className="font-bold text-amber-700">{nutritionGoals!.dailyCalories} kcal/day</span>
                                    </div>
                                )}
                            </div>
                            <Separator />
                        </>
                    )}

                    <div className="space-y-3">
                        <Button
                            onClick={onNavigateToMealLog}
                            variant="outline"
                            className="w-full h-12 rounded-2xl text-base font-bold border-amber-300 bg-amber-50 hover:bg-amber-100 gap-2"
                        >
                            <Target size={18} className="text-amber-500" />
                            {hasGoals ? 'Edit Nutrition Goals' : 'Set Nutrition Goals'}
                        </Button>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Food Allergens</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {hasAllergens ? (
                                foodProfile?.allergens?.map((allergen: Allergen) => (
                                    <span key={allergen} className="px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-sm font-medium">
                                        {allergen}
                                    </span>
                                ))
                            ) : (
                                <span className="text-gray-400 text-sm">No allergens selected</span>
                            )}
                        </div>
                    </div>

                    <Separator />

                    <Button
                        variant="outline"
                        onClick={() => setShowEditFoodProfile(true)}
                        className="w-full h-12 rounded-2xl text-base font-bold border-gray-200 hover:bg-gray-50 gap-2"
                    >
                        <span className="text-lg">🍽️</span> Edit Food Preferences
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => setShowEditProfile(true)}
                        className="w-full h-12 rounded-2xl text-base font-bold border-gray-200 hover:bg-gray-50 gap-2"
                    >
                        <Edit size={18} /> Edit Profile
                    </Button>

                    <Button
                        variant="destructive"
                        onClick={onLogout}
                        className="w-full h-12 rounded-2xl text-base font-bold gap-2"
                    >
                        <LogOut size={18} /> Logout
                    </Button>
                </CardContent>
            </Card>
            )}
        </div>
    );
};

export default ProfileTab;
