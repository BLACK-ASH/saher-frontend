import { LoginForm } from "@/features/login/components/login-form";
import Image from "next/image";

export default function LoginPage() {
  return (
  <div className="bg-background relative flex min-h-[95vh] flex-col items-center justify-center gap-6 ">
        <Image src={'/login-background.jpeg'} alt="background-logo" fill/>
      <div className="w-full z-10 max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}
