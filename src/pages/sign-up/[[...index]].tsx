import { SignUp } from "@clerk/nextjs";

const SignUpPage = () => (
  <div className="flex h-screen w-full items-center justify-center">
    <SignUp
      path="/sign-up"
      routing="path"
      signInUrl="/sign-in"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
    />
  </div>
);

export default SignUpPage;
