"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  loginAction,
  signupAction,
  googleLoginAction,
  type AuthFormState,
} from "@/app/actions/auth";

type AuthDict = {
  loginTitle: string;
  loginSubtitle: string;
  signupTitle: string;
  signupSubtitle: string;
  email: string;
  password: string;
  displayName: string;
  googleLogin: string;
  or: string;
  emailLogin: string;
  emailSignup: string;
  haveAccount: string;
  needAccount: string;
  invalidCredentials: string;
  signupFailed: string;
};

const inputClass =
  "h-11 w-full rounded-lg border border-zinc-300 bg-transparent px-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-600";

function GoogleButton({ label }: { label: string }) {
  return (
    <form action={googleLoginAction}>
      <button
        type="submit"
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-zinc-300 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
          />
        </svg>
        {label}
      </button>
    </form>
  );
}

export function LoginForm({ dict }: { dict: AuthDict }) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    loginAction,
    undefined
  );

  return (
    <div className="flex flex-col gap-4">
      <GoogleButton label={dict.googleLogin} />
      <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
        {dict.or}
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
      </div>
      <form action={formAction} className="flex flex-col gap-3">
        <input type="email" name="email" required placeholder={dict.email} className={inputClass} />
        <input
          type="password"
          name="password"
          required
          minLength={6}
          placeholder={dict.password}
          className={inputClass}
        />
        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {dict.invalidCredentials}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="h-11 rounded-lg bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {dict.emailLogin}
        </button>
      </form>
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        {dict.needAccount}{" "}
        <Link href="/signup" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          {dict.signupTitle.toLowerCase()}
        </Link>
      </p>
    </div>
  );
}

export function SignupForm({ dict }: { dict: AuthDict }) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    signupAction,
    undefined
  );

  return (
    <div className="flex flex-col gap-4">
      <GoogleButton label={dict.googleLogin} />
      <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
        {dict.or}
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
      </div>
      <form action={formAction} className="flex flex-col gap-3">
        <input type="text" name="displayName" required placeholder={dict.displayName} className={inputClass} />
        <input type="email" name="email" required placeholder={dict.email} className={inputClass} />
        <input
          type="password"
          name="password"
          required
          minLength={6}
          placeholder={dict.password}
          className={inputClass}
        />
        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {dict.signupFailed}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="h-11 rounded-lg bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {dict.emailSignup}
        </button>
      </form>
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        {dict.haveAccount}{" "}
        <Link href="/login" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          {dict.loginTitle.toLowerCase()}
        </Link>
      </p>
    </div>
  );
}
