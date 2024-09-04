"use client";

import Image from "next/image";
import Link from "next/link";

const SocialLogins = ({ mode }) => {
    const handleAuth = (e) => {
        if (e === "google") {
            signIn("google", { callbackUrl: process.env.NEXT_PUBLIC_CALLBACK_URL });
        }
    };

    return (
        <>
            <div className="flex gap-4  w-[415px]">
                <button
                    onClick={() => {
                        handleAuth("google");
                    }}
                    className="w-full border-gray-600/30 border rounded-md flex items-center gap-2 justify-center"
                >
                    <Image src="/google.png" alt="google" width={40} height={40} className="p-[4px]"/>
                    {mode === "login" ? <span>Continue with Google</span> : <span>Sign up with Google</span>}
                </button>
            </div>
            {mode === "register" ? (
                <div className="text-center text-xs text-gray-500 mt-2">
                    Already have an Account?{" "}
                    <Link className="text-blue-500" href="/login">
                        Login
                    </Link>
                </div>
            ) : (
                <div className="text-center text-xs text-gray-500 mt-2">
                    Don’t have an Account?{" "}
                    <Link className="text-blue-500" href="/register">
                        Create Account
                    </Link>
                </div>
            )}
        </>
    );
};

export default SocialLogins;
