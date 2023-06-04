import { SignIn } from "@clerk/nextjs";

const SignInPage = () => (
  <div className="flex h-screen w-full items-center justify-center">
    <SignIn
      path="/sign-in"
      routing="path"
      signUpUrl="/sign-up"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
    />
  </div>
);

export default SignInPage;
