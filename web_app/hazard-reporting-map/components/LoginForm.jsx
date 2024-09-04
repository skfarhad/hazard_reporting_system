"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const LoginForm = () => {
    const router = useRouter();
    const [error, setError] = useState("");
    const [isPasswordVisible, setIsPasswordVisible] = useState(false); 

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const togglePasswordVisibility = () => {
        setIsPasswordVisible((prevState) => !prevState);
    };

    const onSubmit = async (event) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const email = formData.get("email");
        const password = formData.get("password");

        if (!validateEmail(email)) {
            setError("Please enter a valid email address.");
            return;
        }

        try {
            const response = await login(formData);
            if (!!response.error) {
                setError(response.error.message);
            } else {
                router.push("/");
            }
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <>
            {error && <div className="text-xl text-red-500 text-center">{error}</div>}
            <form className="login-form" onSubmit={onSubmit}>
                <div>
                    <label htmlFor="email" className="text-gray-600">
                        Email
                    </label>
                    <input type="email" name="email" id="email" placeholder="Enter your email address" />
                </div>

                <div>
                    <label htmlFor="password" className="text-gray-600">
                        Password
                    </label>
                    <div className="relative w-full">
                        <input
                            type={isPasswordVisible ? "text" : "password"}
                            placeholder="Enter your Password"
                            className="w-full px-2 py-2 text-base border border-gray-300 rounded outline-none focus:ring-blue-500 focus:border-blue-500 focus:ring-1"
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-600"
                            onClick={togglePasswordVisibility}
                        >
                            {!isPasswordVisible ? (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="w-5 h-5"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                                    />
                                </svg>
                            ) : (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="w-5 h-5"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                </svg>
                            )}
                        </button>
                    </div>
                    <span className="text-right text-xs text-blue-500 mt-[-25px] pb-6">Forgot Password?</span>
                </div>

                <button
                    type="submit"
                    className="btn-primary w-[415px] h-[52px] pt-[10px] pr-[150px] pb-[10px] pl-[150px] rounded-sm"
                >
                    Login
                </button>
            </form>
        </>
    );
};

export default LoginForm;
