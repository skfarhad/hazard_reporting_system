import Image from "next/image";
import DropdownButton from "../components/Dropdown";
import LoginForm from "../components/LoginForm";
import SocialLogins from "../components/SocialLogin";

export default function LoginPage() {
    return (
        <section className="h-screen place-items-center">
            <div className="flex items-center">
                <div className="max-w-[450px] w-full mx-auto p-6 rounded-md">
                    <h4 className="text-2xl text-center">Welcome to Hazard Reporting System</h4>
                    <DropdownButton />
                    <LoginForm />
                    <SocialLogins mode={"login"} />
                </div>
                <div>
                    <Image src="/CoverImage.jpg" alt="CoverImage" height={900} width={600} />
                </div>
            </div>
        </section>
    );
}
