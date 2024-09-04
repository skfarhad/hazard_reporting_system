import Image from "next/image";
import DropdownButton from "../components/Dropdown";
import RegistrationForm from "../components/RegistrationForm";
import SocialLogins from "../components/SocialLogin";


export default function RegistrationPage() {
    return (
        <section className="h-screen place-items-center">
            <div className="flex items-center">
                <div className="max-w-[450px] w-full mx-auto p-6 mt-[124px] rounded-md">
                <h4 className="text-2xl text-center text-[#2F3646]">Welcome to Hazard Reporting</h4>
                <h4 className="text-2xl text-center text-[#2F3646]">System</h4>
                    <DropdownButton />
                    <RegistrationForm />
                    <SocialLogins mode={"register"} />
                </div>            
            </div>
        </section>
    );
}
