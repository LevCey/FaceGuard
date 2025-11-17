#[test_only]
module faceguard::faceguard_tests {
    use faceguard::faceguard::{Self, FaceOwnershipNFT, FaceGuardRegistry};
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::test_utils;
    use std::string::{Self, String};

    const USER1: address = @0xA;
    const USER2: address = @0xB;

    // Helper function to create test scenario and initialize registry
    fun setup_test(): Scenario {
        let mut scenario = ts::begin(USER1);
        {
            faceguard::init_for_testing(ts::ctx(&mut scenario));
        };
        scenario
    }

    #[test]
    fun test_mint_ownership_nft() {
        let mut scenario = setup_test();

        // Mint an NFT
        ts::next_tx(&mut scenario, USER1);
        {
            let face_hash = b"hash_12345";
            let walrus_blob_id = b"blob_67890";
            let registration_date = 1699000000u64;

            faceguard::mint_ownership(
                face_hash,
                walrus_blob_id,
                registration_date,
                ts::ctx(&mut scenario)
            );
        };

        // Verify the NFT was created and transferred to USER1
        ts::next_tx(&mut scenario, USER1);
        {
            let nft = ts::take_from_sender<FaceOwnershipNFT>(&scenario);

            // Verify NFT properties
            assert!(faceguard::get_face_hash(&nft) == string::utf8(b"hash_12345"), 0);
            assert!(faceguard::get_walrus_blob_id(&nft) == string::utf8(b"blob_67890"), 1);
            assert!(faceguard::get_registration_date(&nft) == 1699000000u64, 2);

            ts::return_to_sender(&scenario, nft);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_transfer_ownership() {
        let mut scenario = setup_test();

        // USER1 mints an NFT
        ts::next_tx(&mut scenario, USER1);
        {
            faceguard::mint_ownership(
                b"hash_test",
                b"blob_test",
                1699000000u64,
                ts::ctx(&mut scenario)
            );
        };

        // USER1 transfers the NFT to USER2
        ts::next_tx(&mut scenario, USER1);
        {
            let nft = ts::take_from_sender<FaceOwnershipNFT>(&scenario);
            faceguard::transfer_ownership(nft, USER2);
        };

        // Verify USER2 received the NFT
        ts::next_tx(&mut scenario, USER2);
        {
            let nft = ts::take_from_sender<FaceOwnershipNFT>(&scenario);
            assert!(faceguard::get_face_hash(&nft) == string::utf8(b"hash_test"), 0);
            ts::return_to_sender(&scenario, nft);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_multiple_nfts_same_user() {
        let mut scenario = setup_test();

        // Mint first NFT
        ts::next_tx(&mut scenario, USER1);
        {
            faceguard::mint_ownership(
                b"hash_1",
                b"blob_1",
                1699000000u64,
                ts::ctx(&mut scenario)
            );
        };

        // Mint second NFT
        ts::next_tx(&mut scenario, USER1);
        {
            faceguard::mint_ownership(
                b"hash_2",
                b"blob_2",
                1699000001u64,
                ts::ctx(&mut scenario)
            );
        };

        // Verify both NFTs exist
        ts::next_tx(&mut scenario, USER1);
        {
            let nft1 = ts::take_from_sender<FaceOwnershipNFT>(&scenario);
            let nft2 = ts::take_from_sender<FaceOwnershipNFT>(&scenario);

            // Verify they have different hashes
            let hash1 = faceguard::get_face_hash(&nft1);
            let hash2 = faceguard::get_face_hash(&nft2);
            assert!(hash1 != hash2, 0);

            ts::return_to_sender(&scenario, nft1);
            ts::return_to_sender(&scenario, nft2);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_getter_functions() {
        let mut scenario = setup_test();

        ts::next_tx(&mut scenario, USER1);
        {
            let test_hash = b"test_face_hash_123";
            let test_blob = b"test_walrus_blob_456";
            let test_date = 1699123456u64;

            faceguard::mint_ownership(
                test_hash,
                test_blob,
                test_date,
                ts::ctx(&mut scenario)
            );
        };

        ts::next_tx(&mut scenario, USER1);
        {
            let nft = ts::take_from_sender<FaceOwnershipNFT>(&scenario);

            // Test all getter functions
            assert!(faceguard::get_face_hash(&nft) == string::utf8(b"test_face_hash_123"), 0);
            assert!(faceguard::get_walrus_blob_id(&nft) == string::utf8(b"test_walrus_blob_456"), 1);
            assert!(faceguard::get_registration_date(&nft) == 1699123456u64, 2);

            ts::return_to_sender(&scenario, nft);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_init_creates_shared_registry() {
        let mut scenario = setup_test();

        // Verify the registry was created as a shared object
        ts::next_tx(&mut scenario, USER1);
        {
            let registry = ts::take_shared<FaceGuardRegistry>(&scenario);
            ts::return_shared(registry);
        };

        ts::end(scenario);
    }
}
