import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

// Firebase Imports
import { signOut } from "firebase/auth"
import { auth } from "@/config/firebaseConfig"

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
            <div className="px-4 flex h-14 items-center">
                <div className="flex flex-1 items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                            <circle cx="12" cy="12" r="10" />
                            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                        </svg>
                        <span className="hidden font-bold sm:inline-block">
                            YourLogo
                        </span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleSignOut}>
                        <LogOut className="h-5 w-5" />
                        <span className="sr-only">Sign out</span>
                    </Button>
                </div>
            </div>
        </header>
    )
}