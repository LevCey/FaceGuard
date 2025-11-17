module faceguard::faceguard {
    use sui::object::{Self as object, UID};
    use sui::transfer;
    use sui::tx_context::{Self as tx_context, TxContext};
    use std::string::{Self as string, String};

    public struct FaceOwnershipNFT has key, store {
        id: UID,
        face_hash: String,
        walrus_blob_id: String,
        registration_date: u64,
        owner: address,
    }

    public struct FaceGuardRegistry has key {
        id: UID,
        total_registrations: u64,
    }

    fun init(ctx: &mut TxContext) {
        let registry = FaceGuardRegistry {
            id: object::new(ctx),
            total_registrations: 0,
        };
        transfer::share_object(registry);
    }

    public entry fun mint_ownership(
        face_hash: vector<u8>,
        walrus_blob_id: vector<u8>,
        registration_date: u64,
        ctx: &mut TxContext
    ) {
        let nft = FaceOwnershipNFT {
            id: object::new(ctx),
            face_hash: string::utf8(face_hash),
            walrus_blob_id: string::utf8(walrus_blob_id),
            registration_date,
            owner: tx_context::sender(ctx),
        };

        transfer::transfer(nft, tx_context::sender(ctx));
    }

    public entry fun transfer_ownership(
        nft: FaceOwnershipNFT,
        recipient: address,
    ) {
        transfer::transfer(nft, recipient);
    }

    public fun get_face_hash(nft: &FaceOwnershipNFT): String {
        nft.face_hash
    }

    public fun get_registration_date(nft: &FaceOwnershipNFT): u64 {
        nft.registration_date
    }

    public fun get_walrus_blob_id(nft: &FaceOwnershipNFT): String {
        nft.walrus_blob_id
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}
