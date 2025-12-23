"use client";

import {
  BellIcon,
  HomeIcon,
  LogOutIcon,
  MenuIcon,
  MoonIcon,
  SunIcon,
  UserIcon,
  HeartIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";
import { useAuth, SignInButton, SignOutButton } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import Link from "next/link";

const themes = ["light", "dark", "pink"] as const;

function MobileNavbar() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { isSignedIn } = useAuth();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    const currentIndex = themes.indexOf(theme as any);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
  };

  return (
    <div className="flex md:hidden items-center space-x-2">
      {/* THEME TOGGLE */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="relative"
      >
        {/* Light */}
        <SunIcon className="h-[1.2rem] w-[1.2rem] transition-all scale-100 dark:scale-0 pink:scale-0" />

        {/* Dark */}
        <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] transition-all scale-0 dark:scale-100 pink:scale-0" />

        {/* Pink */}
        <HeartIcon className="absolute h-[1.2rem] w-[1.2rem] transition-all scale-0 pink:scale-100 text-pink-500" />

        <span className="sr-only">Toggle theme</span>
      </Button>

      {/* MENU */}
      <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <MenuIcon className="h-5 w-5" />
          </Button>
        </SheetTrigger>

        <SheetContent side="right" className="w-[300px]">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>

          <nav className="flex flex-col space-y-4 mt-6">
            <Button variant="ghost" className="justify-start gap-3" asChild>
              <Link href="/">
                <HomeIcon className="w-4 h-4" />
                Home
              </Link>
            </Button>

            {isSignedIn ? (
              <>
                <Button variant="ghost" className="justify-start gap-3" asChild>
                  <Link href="/notifications">
                    <BellIcon className="w-4 h-4" />
                    Notifications
                  </Link>
                </Button>

                <Button variant="ghost" className="justify-start gap-3" asChild>
                  <Link href="/profile">
                    <UserIcon className="w-4 h-4" />
                    Profile
                  </Link>
                </Button>

                <SignOutButton>
                  <Button
                    variant="ghost"
                    className="justify-start gap-3 w-full"
                  >
                    <LogOutIcon className="w-4 h-4" />
                    Logout
                  </Button>
                </SignOutButton>
              </>
            ) : (
              <SignInButton mode="modal">
                <Button className="w-full">Sign In</Button>
              </SignInButton>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default MobileNavbar;
