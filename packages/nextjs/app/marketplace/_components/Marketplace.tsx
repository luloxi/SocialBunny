"use client";

import { useEffect, useState } from "react";
import { NFTCard } from "./NFTCard";
import { MarketplaceDescription } from "./marketplaceDescription";
import { useAccount } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useScaffoldContract, useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { getMetadataFromIPFS } from "~~/utils/simpleNFT/ipfs-fetch";
import { NFTMetaData } from "~~/utils/simpleNFT/nftsMetadata";

export interface Collectible extends Partial<NFTMetaData> {
  listingId?: number;
  uri: string;
  owner: string;
  price?: string;
  payableCurrency?: string;
  isAuction?: boolean;
  date?: string;
  highestBidder?: string;
  maxTokenId?: number;
}

export const Marketplace = () => {
  const { address: isConnected, isConnecting } = useAccount();
  const [listedCollectibles, setListedCollectibles] = useState<Collectible[]>([]);

  // Tab management state
  const [activeTab, setActiveTab] = useState("newest");

  const { data: yourCollectibleContract } = useScaffoldContract({
    contractName: "MockNFT",
  });

  const {
    data: events,
    isLoading: isLoadingEvents,
    error: errorReadingEvents,
  } = useScaffoldEventHistory({
    contractName: "Marketplace",
    eventName: "ListingCreated",
    fromBlock: 0n,
    watch: true,
  });

  const {
    data: purchaseEvents,
    isLoading: purchaseIsLoadingEvents,
    error: purchaseErrorReadingEvents,
  } = useScaffoldEventHistory({
    contractName: "Marketplace",
    eventName: "Purchase",
    fromBlock: 0n,
    watch: true,
  });

  const {
    data: simpleMintEvents,
    isLoading: simpleMintIsLoadingEvents,
    error: simpleMintErrorReadingEvents,
  } = useScaffoldEventHistory({
    contractName: "SimpleMint",
    eventName: "CollectionStarted",
    fromBlock: 0n,
    watch: true,
  });

  useEffect(() => {
    const fetchListedNFTs = async () => {
      if (!events || !yourCollectibleContract) return;

      const collectiblesUpdate: Collectible[] = [];

      for (const event of events) {
        try {
          const { args } = event;
          const listingId = args?.listingId;
          const nftId = args?.nftId;
          const seller = args?.seller;
          const price = args?.price;
          const payableCurrency = args?.payableCurrency === 0 ? "ETH" : "USDC";
          const isAuction = args?.isAuction;
          const date = new Date(Number(args?.date) * 1000).toLocaleDateString();
          const highestBidder = args?.highestBidder;

          const tokenURI = await yourCollectibleContract.read.tokenURI([nftId ? BigInt(nftId) : 0n]);
          const ipfsHash = tokenURI.replace("https://ipfs.io/ipfs/", "");
          const nftMetadata: NFTMetaData = await getMetadataFromIPFS(ipfsHash);

          collectiblesUpdate.push({
            listingId: listingId !== undefined ? parseInt(listingId.toString()) : 0,
            uri: tokenURI,
            owner: seller || "",
            price: price?.toString(),
            payableCurrency: payableCurrency,
            isAuction: !!isAuction,
            date,
            highestBidder,
            ...nftMetadata,
          });
        } catch (e) {
          notification.error("Error fetching listed collectibles");
          console.error(e);
        }
      }

      for (const event of simpleMintEvents || []) {
        try {
          const { args } = event;
          const artist = args?.artist;
          const tokenURI = args?.tokenURI;
          const usdPrice = args?.usdPrice;
          const maxTokenId = args?.maxTokenId;

          if (!tokenURI) continue;

          const ipfsHash = tokenURI.replace("https://ipfs.io/ipfs/", "");
          const nftMetadata: NFTMetaData = await getMetadataFromIPFS(ipfsHash);

          collectiblesUpdate.push({
            listingId: undefined,
            uri: tokenURI,
            owner: artist || "",
            price: usdPrice ? usdPrice.toString() : undefined,
            payableCurrency: usdPrice ? "USDC" : undefined,
            maxTokenId: maxTokenId ? Number(maxTokenId) : undefined,
            ...nftMetadata,
          });
        } catch (e) {
          notification.error("Error fetching collection started NFTs");
          console.error(e);
        }
      }

      const updatedCollectibles = collectiblesUpdate.filter(collectible => {
        const hasBeenPurchased = purchaseEvents?.some(purchase => {
          const purchaseItemId = Number(purchase.args.itemId);
          return purchaseItemId === collectible.listingId;
        });
        return !hasBeenPurchased;
      });

      setListedCollectibles(updatedCollectibles);
    };

    fetchListedNFTs();
  }, [events, simpleMintEvents, purchaseEvents, yourCollectibleContract]);

  const filteredCollectibles = listedCollectibles.filter(collectible => {
    if (activeTab === "on-sale") {
      return collectible.listingId && collectible.price;
    }
    if (activeTab === "mintables") {
      return collectible.maxTokenId;
    }
    return true;
  });

  if (isLoadingEvents || simpleMintIsLoadingEvents || purchaseIsLoadingEvents) {
    return (
      <div className="flex justify-center items-center mt-10">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (errorReadingEvents || simpleMintErrorReadingEvents || purchaseErrorReadingEvents) {
    return <div>Error fetching events: {errorReadingEvents?.message || purchaseErrorReadingEvents?.message}</div>;
  }

  return (
    <>
      <MarketplaceDescription />
      <div className="mt-2 md:px-4 w-full rounded-lg">
        <div className="tabs justify-start flex-wrap border-b-2 border-base-300">
          <a
            className={`tab tab-lifted text-lg whitespace-nowrap ${
              activeTab === "newest" ? "border-blue-500 font-bold text-blue-500" : ""
            }`}
            onClick={() => setActiveTab("newest")}
          >
            Newest
          </a>
          <a
            className={`tab tab-lifted text-lg whitespace-nowrap ${
              activeTab === "on-sale" ? "border-blue-500 font-bold text-blue-500" : ""
            }`}
            onClick={() => setActiveTab("on-sale")}
          >
            On Sale
          </a>
          <a
            className={`tab tab-lifted text-lg whitespace-nowrap ${
              activeTab === "mintables" ? "border-blue-500 font-bold text-blue-500" : ""
            }`}
            onClick={() => setActiveTab("mintables")}
          >
            Mintables
          </a>
        </div>
      </div>

      <div className="flex justify-center">{!isConnected || isConnecting ? <RainbowKitCustomConnectButton /> : ""}</div>
      {filteredCollectibles.length === 0 ? (
        <div className="flex justify-center items-center mt-10">
          <div className="text-2xl text-primary-content">No NFTs found</div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-6 my-4 px-5 justify-center">
          {filteredCollectibles.map(item => (
            <NFTCard nft={item} key={item.uri} />
          ))}
        </div>
      )}
    </>
  );
};
