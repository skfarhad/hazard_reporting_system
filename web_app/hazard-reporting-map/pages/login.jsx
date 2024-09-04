import DropdownButton from "../components/Dropdown";
import LoginForm from "../components/LoginForm";
import SocialLogins from "../components/SocialLogin";

export default function LoginPage() {
    return (
        <section className="h-screen place-items-center">
            <div className="flex items-center">
                <div className="max-w-[450px] w-full mx-auto mt-[234px] p-6 rounded-md">
                    <h4 className="text-2xl text-center text-[#2F3646]">Welcome to Hazard Reporting</h4>
                    <h4 className="text-2xl text-center text-[#2F3646]">System</h4>
                    <DropdownButton />
                    <LoginForm />
                    <SocialLogins mode={"login"} />
                </div>
            </div>
        </section>
    );
}
