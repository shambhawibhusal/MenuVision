import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { FoodProfile, ALLERGENS, Allergen, DEFAULT_FOOD_PROFILE } from '@/types/dashboard';
import { User } from 'firebase/auth';
import { ChevronRight, Leaf, Wheat, Check } from 'lucide-react';

interface OnboardingScreenProps {
    user: User;
    onComplete: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ user, onComplete }) => {
    const [step, setStep] = useState(1);
    const [foodProfile, setFoodProfile] = useState<FoodProfile>(DEFAULT_FOOD_PROFILE);
    const [loading, setLoading] = useState(false);

    const totalSteps = 2;

    const toggleDietary = (key: 'isVegetarian' | 'isVegan' | 'isGlutenFree') => {
        setFoodProfile(prev => {
            const newValue = !prev[key];
            if (key === 'isVegan' && newValue) {
                return { ...prev, isVegan: true, isVegetarian: true };
            }
            if (key === 'isVegetarian' && !newValue && prev.isVegan) {
                return { ...prev, isVegetarian: false, isVegan: false };
            }
            return { ...prev, [key]: newValue };
        });
    };

    const toggleAllergen = (allergen: Allergen) => {
        setFoodProfile(prev => ({
            ...prev,
            allergens: prev.allergens.includes(allergen)
                ? prev.allergens.filter(a => a !== allergen)
                : [...prev.allergens, allergen]
        }));
    };

    const saveAndComplete = async (completed: boolean) => {
        setLoading(true);
        try {
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, {
                foodProfile: {
                    ...foodProfile,
                    onboardingCompleted: completed
                }
            }, { merge: true });
            onComplete();
        } catch (error) {
            console.error('Error saving food profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        saveAndComplete(false);
    };

    const handleNext = () => {
        if (step < totalSteps) {
            setStep(step + 1);
        } else {
            saveAndComplete(true);
        }
    };

    return (
        <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
            <Card className="w-full max-w-md shadow-2xl border-none bg-white/95 backdrop-blur-sm mx-4">
                <CardHeader className="text-center pt-8">
                    <div className="flex justify-center gap-1.5 mb-4">
                        {Array.from({ length: totalSteps }).map((_, i) => (
                            <div
                                key={i}
                                className={`h-2 rounded-full transition-all duration-300 ${
                                    i + 1 <= step ? 'bg-amber-400 w-8' : 'bg-gray-200 w-2'
                                }`}
                            />
                        ))}
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                        {step === 1 ? 'Dietary Preferences' : 'Food Allergens'}
                    </CardTitle>
                    <CardDescription className="text-gray-500">
                        {step === 1
                            ? 'Tell us about your dietary preferences to get personalized recommendations.'
                            : 'Select any food allergens we should know about.'}
                    </CardDescription>
                </CardHeader>

                <CardContent className="px-6 py-4">
                    {step === 1 && (
                        <div className="space-y-3">
                            <button
                                onClick={() => toggleDietary('isVegetarian')}
                                className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                                    foodProfile.isVegetarian
                                        ? 'border-green-500 bg-green-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                    foodProfile.isVegetarian ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'
                                }`}>
                                    <Leaf size={24} />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="font-bold text-gray-900">Vegetarian</div>
                                    <div className="text-sm text-gray-500">No meat or fish</div>
                                </div>
                                {foodProfile.isVegetarian && (
                                    <Check size={20} className="text-green-500" />
                                )}
                            </button>

                            <button
                                onClick={() => toggleDietary('isVegan')}
                                className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                                    foodProfile.isVegan
                                        ? 'border-green-500 bg-green-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                    foodProfile.isVegan ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'
                                }`}>
                                    <span className="text-2xl">🌱</span>
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="font-bold text-gray-900">Vegan</div>
                                    <div className="text-sm text-gray-500">No animal products</div>
                                </div>
                                {foodProfile.isVegan && (
                                    <Check size={20} className="text-green-500" />
                                )}
                            </button>

                            <button
                                onClick={() => toggleDietary('isGlutenFree')}
                                className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                                    foodProfile.isGlutenFree
                                        ? 'border-amber-500 bg-amber-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                    foodProfile.isGlutenFree ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-500'
                                }`}>
                                    <Wheat size={24} />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="font-bold text-gray-900">Gluten-Free</div>
                                    <div className="text-sm text-gray-500">No wheat or gluten</div>
                                </div>
                                {foodProfile.isGlutenFree && (
                                    <Check size={20} className="text-amber-500" />
                                )}
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="flex flex-wrap gap-2">
                            {ALLERGENS.map((allergen) => (
                                <button
                                    key={allergen}
                                    onClick={() => toggleAllergen(allergen)}
                                    className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                                        foodProfile.allergens.includes(allergen)
                                            ? 'bg-red-500 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {allergen}
                                </button>
                            ))}
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex flex-col gap-3 pb-8 px-6">
                    <Button
                        onClick={handleNext}
                        disabled={loading}
                        className="w-full h-12 rounded-xl bg-black text-white hover:bg-gray-800 text-lg font-bold"
                    >
                        {loading ? 'Saving...' : step === totalSteps ? 'Complete Setup' : (
                            <span className="flex items-center gap-2">
                                Continue <ChevronRight size={18} />
                            </span>
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={handleSkip}
                        disabled={loading}
                        className="w-full text-gray-400 hover:text-gray-600"
                    >
                        Skip for now
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default OnboardingScreen;
