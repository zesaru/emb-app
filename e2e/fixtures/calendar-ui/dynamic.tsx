import React, { lazy, Suspense } from "react";

// Next's dynamic loader is replaced only in the browser fixture.
export default function dynamic<P extends object>(
  loader: () => Promise<{ default: React.ComponentType<P> }>,
  options: { loading?: React.ComponentType },
) {
  const Component = lazy(loader);
  const Loading = options.loading;
  return function FixtureDynamic(props: P) {
    return <Suspense fallback={Loading ? <Loading /> : null}><Component {...props} /></Suspense>;
  };
}
