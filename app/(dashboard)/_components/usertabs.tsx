'use client';

import { usePersonStore } from "@/store";
import {useEffect} from "react";

const Usertabs = ( {user}: any) => {
    const safeUser = user ?? {
      name: "Usuario",
      email: "",
      role: "user",
      num_vacations: 0,
      num_compensatorys: 0,
    };

    const setUserName = usePersonStore ( state => state.setUserName );

    useEffect(() => {
        setUserName(safeUser.name ?? "Usuario");
    }, [safeUser.name, setUserName]);

    console.log(safeUser);
    return (
    <div className="bg-slate-100  mt-[77px]  py-3 px-3">
      <section className="relative overflow-hidden">
        <div className="container">
          <div className="flex">
            <div className="w-full">
              <h3 className="text-xl text-gray-800 mt-2">{safeUser.name}</h3>
              <p className="mt-1 font-medium mb-4">Welcome!</p>
            </div>
          </div>
          <div className="grid grid-cols-12 gap-6 mt-2">
            {/* profile widget star */}
            <div className="lg:col-span-5 col-span-12">
              <div className="bg-white rounded">
                <div className="p-6">
                  <div className="flex">
                    <div className="grow">
                      <div className="flex">
                        {/* <img src="assets/images/avatars/img-8.jpg" className="img-fluid w-12 h-12 rounded me-3" alt="..." /> */}
                        <div className="grow">
                          <h4 className="tetx-lg text-gray-800 mb-1 mt-0 font-semibold">
                            {safeUser.name}
                          </h4>
                          <p className="text-gray-400 pb-0 text-sm mb-4 font-medium">
                            {safeUser.role}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 flex-wrap py-4 border-b">
                    <div className="mb-2">
                      <a
                        href="#"
                        className="flex gap-0.5 text-gray-400 text-sm"
                      >
                        <svg
                          className="h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                        {safeUser.email}
                      </a>
                    </div>
                    <div className="mb-2">
                      <a
                        href="#"
                        className="flex gap-0.5 text-gray-400 text-sm"
                      >
                        <svg
                          className="h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        Anexo 2xx
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 mt-4">
                    <div className="md:w-1/2 w-full">
                      <div className="flex justify-between mb-3">
                        <h6 className="fw-medium my-0">Vacaciones</h6>
                        <p className="float-end mb-0">15%</p>
                      </div>
                      <div className="flex w-full h-1.5 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700 ">
                        <div
                          className="flex flex-col justify-center overflow-hidden bg-primary"
                          role="progressbar"
                          style={{ width: "15%" }}
                          aria-valuenow={25}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        />
                      </div>
                    </div>
                    <div className="md:w-1/2 w-full">
                      <div className="flex justify-between mb-3">
                        <h6 className="fw-medium my-0">Compensatorios</h6>
                        <p className="float-end mb-0">7.5</p>
                      </div>
                      <div className="flex w-full h-1.5 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700 ">
                        <div
                          className="flex flex-col justify-center overflow-hidden bg-orange-500"
                          role="progressbar"
                          style={{ width: "85%" }}
                          aria-valuenow={25}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* profile widget end */}
            <div className="lg:col-span-3 col-span-12 space-y-6">
              <div className="bg-white">
                <div className="flex items-center p-6">
                  <div className="">
                    <div className="inline-flex items-center justify-center h-12 w-12 bg-green-500/10 rounded me-3">
                      <svg
                        className="text-green-500"
                        xmlns="http://www.w3.org/2000/svg"
                        width={24}
                        height={24}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-grow-1">
                    <h3 className="text-xl text-gray-800">
                      {safeUser.num_vacations}
                    </h3>
                    <p className="mb-0">Vacaciones</p>
                  </div>
                </div>
              </div>
              <div className="bg-white">
                <div className="flex items-center p-6">
                  <div className="">
                    <div className="inline-flex items-center justify-center h-12 w-12 bg-sky-500/10 rounded me-3">
                      <svg
                        className="text-sky-500"
                        xmlns="http://www.w3.org/2000/svg"
                        width={24}
                        height={24}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                    </div>
                  </div>
                  <div className="grow">
                    <h3 className="text-xl text-gray-800">
                      {safeUser.num_compensatorys}
                    </h3>
                    <p className="mb-0">Compensatorios</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-4 col-span-12">
              <div className="bg-white">
                <div className="p-6">
                  <div className="flex justify-between">
                    <div className="grow">
                      <h4 className="text-base font-semibold text-gray-800">
                        Tardanzas
                      </h4>
                    </div>
                  </div>
                  <h1 className="text-3xl text-gray-800 my-2.5">xxxxx</h1>
                  <p className="text-gray-400 text-sm">Ultimo mes</p>
                  <hr className="my-3.5" />
                </div>
              </div>
            </div>
          </div>
          {/* end grid */}
        </div>
      </section>
    </div>
  );
};

export default Usertabs;
