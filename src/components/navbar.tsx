import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

// Firebase Imports
import { signOut } from "firebase/auth";
import { auth } from "@/config/firebaseConfig";

// Images
import texhXinfinia from "@/assets/texhXinfinia.png";
import puzzler from "@/assets/puzzlers.png";

// Interface
interface NavbarProps {
    onSignOut: () => void; // Function type for sign-out handler
}

export default function Navbar({ onSignOut }: NavbarProps) {
    const handleSignOut = async() => {
        try {
            await signOut(auth);
            onSignOut();
            console.log("Signed out successfully");
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:text-white">
            <div className="px-4 flex items-center py-4">
                <div className="flex flex-1 items-center justify-between">
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                        <img src={texhXinfinia} alt="Logo" className="obect-fit sm:h-16 h-7" />
                        <img src={puzzler} alt="Logo" className="obect-fit sm:h-16 h-7" />
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleSignOut}>
                        <LogOut className="h-7 w-7" />
                        <span className="sr-only">Sign out</span>
                    </Button>
                </div>
            </div>
        </header>
    )
}