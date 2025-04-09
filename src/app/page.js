import GoogleSignIn from "./components/auth/GoogleSignIn";

export default function Home() {
  return (
    <main>
    <h1 className="text-2xl font-bold text-center my-8">Welcome to My App</h1>
    <GoogleSignIn />
  </main>
  );
}
