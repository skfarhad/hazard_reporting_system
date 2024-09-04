"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const RegistrationForm = () => {
    const router = useRouter();
    const [error, setError] = useState("");

    const onSubmit = async (event) => {
        event.preventDefault();
        try {
            const formData = new FormData(event.currentTarget);
            const fname = formData.get("fname");
            const mobile = formData.get("mobile");
            const email = formData.get("email");
            const contribution = formData.get("contribution");

            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    fname,
                    mobile,
                    email,
                    contribution,
                }),
            });
            response.status === 201 && router.push("/login");
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <>
            {error && <div className="text-2xl text-center text-red-500">{error}</div>}
            <form className="login-form" onSubmit={onSubmit}>
                <div>
                    <label htmlFor="fname" className="text-gray-600">
                        Full Name
                    </label>
                    <input type="text" name="fname" id="fname" placeholder="Enter your name" />
                </div>

                <div>
                    <label htmlFor="mobile" className="text-gray-600">
                        Mobile No.
                    </label>
                    <input
                        type="text"
                        name="mobile"
                        id="mobile"
                        placeholder="Enter your mobile number"
                        pattern="\d{11}"
                        title="Please enter a valid 10-digit mobile number"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="email" className="text-gray-600">
                        Email
                    </label>
                    <input type="email" name="email" id="email" placeholder="Enter your email" required />
                </div>

                <div style={{ display: "flex", flexDirection: "row" }}>
                    <span className="text-gray-600">I want to contribute as-</span>
                    <select
                        placeholder="Select"
                        name="contribute"
                        id="contribute"
                        className="w-32 ml-auto bg-[#F3F6F8]"
                    >
                        <option value="Admin" selected>
                            Admin
                        </option>
                        <option value="Admin" selected>
                            Admin
                        </option>
                        <option value="Informer" selected>
                            Informer
                        </option>
                        <option value="Personnel" selected>
                            Personnel
                        </option>
                        <option value="Guest" selected>
                            Guest
                        </option>
                    </select>
                </div>

                <div className="flex flex-row">
                    <label
                        htmlFor="link-checkbox"
                        className="ms-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        {" "}
                        <input
                            id="link-checkbox"
                            type="checkbox"
                            value=""
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        I agree with{" "}
                        <a href="#" className="text-blue-600 dark:text-blue-500 hover:underline">
                            Privacy Policy
                        </a>{" "}
                        and{" "}
                        <a href="#" className="text-blue-600 dark:text-blue-500 hover:underline">
                            Terms and Conditions
                        </a>
                        .
                    </label>
                </div>

                <button type="submit" className="btn-primary w-full mt-4">
                    Create account
                </button>
            </form>
        </>
    );
};

export default RegistrationForm;
