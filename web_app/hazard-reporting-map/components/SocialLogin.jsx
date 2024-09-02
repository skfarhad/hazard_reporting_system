"use client";

import Image from "next/image";
import Link from "next/link";

const SocialLogins = ({ mode }) => {
    const handleAuth = (e) => {
        if (e === "google") {
            signIn("google", { callbackUrl: "http://localhost:3000/" });
        }
    };
    
    return (
        <>
            <div className="flex gap-4">
                <button
                    onClick={() => {
                        handleAuth("google");
                    }}
                    className=" w-full border-gray-600/30 border rounded-md flex items-center gap-2 justify-center"
                >
                    <Image src="/google.png" alt="google" width={40} height={40} />
                    <span>Continue with Google</span>
                </button>
            </div>
            <div className="text-center text-xs text-gray-500 mt-2">
                Don't have an account?{" "}
                <Link className="text-blue-500" href="/register">
                    Create Account
                </Link>
            </div>
        </>
    );
};

export default SocialLogins;
