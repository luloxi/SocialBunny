"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SwitchTheme } from "./SwitchTheme";
import { faHome, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { hardhat } from "viem/chains";
import { useAccount } from "wagmi";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useOutsideClick, useScaffoldReadContract, useTargetNetwork } from "~~/hooks/scaffold-eth";

/**
 * Site header
 */
export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { address: connectedAddress, isConnected } = useAccount();

  const { data: profileInfo } = useScaffoldReadContract({
    contractName: "ProfileInfo",
    functionName: "profiles",
    args: [connectedAddress],
    watch: true,
  });

  const defaultProfilePicture = "/guest-profile.png";

  const profilePicture = profileInfo && profileInfo[2] ? profileInfo[2] : defaultProfilePicture;

  const menuRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuClose = () => {
    setIsMenuOpen(false);
  };

  useOutsideClick(menuRef, handleMenuClose);

  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  return (
    <div className="flex lg:sticky top-0 navbar bg-base-100 min-h-0 flex-shrink-0 justify-between z-20 px-0 sm:px-2">
      <div className="navbar-start ml-2">
        <div className="flex lg:hidden ml-2 items-center justify-center">
          <SwitchTheme className={`pointer-events-auto ${isLocalNetwork ? "self-end md:self-auto" : ""}`} />
        </div>
        <div className="flex flex-row gap-3">
          <Link href="/" passHref>
            <button
              className={`bg-transparent hover:bg-base-200 border-none hidden lg:flex flex-row items-center justify-center text-2xl ${
                pathname === "/" ? "text-blue-600" : ""
              }`}
            >
              <div className="flex flex-row items-center justify-center gap-2">
                <FontAwesomeIcon icon={faHome} className="h-6 w-6" />
                <span>Home</span>
              </div>
            </button>
          </Link>
          <Link href="/create" passHref>
            <button
              className={` bg-transparent hover:bg-base-200 border-none hidden lg:flex flex-row items-center justify-center text-2xl ${
                pathname === "/create" ? "text-blue-600" : ""
              }`}
            >
              <div className="flex flex-row items-center justify-center gap-2">
                <FontAwesomeIcon icon={faPlus} className="h-6 w-6" />
                <span>Create</span>
              </div>
            </button>
          </Link>
        </div>
      </div>

      <div className="navbar-center flex-1 flex justify-center items-center">
        <div className="w-7 h-7 relative">
          <Link href="/" passHref>
            <Image src="/logo.png" alt="Logo" width={50} height={50} style={{ objectFit: "contain" }} />
          </Link>
          {/* <Image
            src="/usdc-logo.png" // Ensure you use the correct path for Next.js
            alt="USDC Logo"
            width={28} // 7 * 4px = 28px
            height={28} // 7 * 4px = 28px
            style={{ objectFit: "contain" }} // Ensures the image behaves like 'object-contain'
          /> */}
        </div>
      </div>

      <div className="navbar-end mr-4 relative" ref={menuRef}>
        <div className="flex flex-row items-center justify-center">
          <SwitchTheme
            className={`mr-4 hidden lg:flex pointer-events-auto ${isLocalNetwork ? "self-end md:self-auto" : ""}`}
          />
          {isConnected ? (
            <>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                onClick={handleMenuToggle}
                style={{
                  backgroundImage: `url(${profilePicture})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              ></div>
            </>
          ) : (
            <>
              <RainbowKitCustomConnectButton />
            </>
          )}
          {isMenuOpen && isConnected && (
            <div className="absolute flex flex-col items-center justify-center right-0 top-10 mt-2 w-48 bg-base-300 shadow-lg rounded-lg">
              <div className="my-2 flex flex-row items-center justify-center gap-2">
                <Link href="/myProfile" passHref>
                  <span className="btn btn-primary bg-base-200 border-0" onClick={handleMenuClose}>
                    My Profile
                  </span>
                </Link>
                <FaucetButton />
              </div>

              <div className="mb-2">
                <RainbowKitCustomConnectButton />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
