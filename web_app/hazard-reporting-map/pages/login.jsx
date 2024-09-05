import LoginForm from "../components/LoginForm";
import SocialLogins from "../components/SocialLogin";

export default function LoginPage() {
    return (
        <section className="h-screen place-items-center font-manrope">
            <div className="flex items-center">
                <div className="max-w-[450px] w-full mx-auto mt-[234px] p-6 rounded-md">
                    <h4 className="font-manrope text-[28px] font-semibold leading-[38.25px] text-center">
                        Welcome to Hazard Reporting System
                    </h4>
                    <LoginForm />
                    <SocialLogins mode={"login"} />
                </div>
            </div>
        </section>
    );
}
