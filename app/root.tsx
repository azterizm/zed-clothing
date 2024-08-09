import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
} from "@remix-run/react";
import "./styles/tailwind.css";
import "./styles/global.css";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="stylesheet" href="/fonts.css" />
        <link rel="icon" href="/logo.svg" sizes="any" type="image/svg+xml"/>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary() {
  const error = useRouteError();
  return (
    <div className='flex items-center justify-center w-screen h-screen flex-col bg-black text-white uppercase'>
      <h1 className="text-xl font-bold mb-2">Error.</h1>
      {isRouteErrorResponse(error) ? (
        <p>{error.data.includes('No route matches URL') ? 'This page does not exist, brother.' : error.data}</p>
      ) : (
        <p>{(error as any)?.message || 'Unknown error'}</p>
      )}
      <Link state={{ noAnimate: true }} to='/' className="mt-8 px-5 py-2 rounded-none bg-white text-black">Go home</Link>
      <Scripts />
    </div>
  );
}

