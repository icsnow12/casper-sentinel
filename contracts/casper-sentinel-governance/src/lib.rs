#![no_main]
#![no_std]

extern crate alloc;

use alloc::{format, string::String, vec};

use casper_contract::{
    contract_api::{runtime, storage},
    unwrap_or_revert::UnwrapOrRevert,
};
use casper_types::{
    account::AccountHash, ApiError, CLType, CLValue, EntryPoint, EntryPointAccess,
    EntryPointPayment, EntryPointType, EntryPoints, Key, NamedKeys, Parameter, URef,
};

const CONTRACT_HASH_KEY: &str = "casper_sentinel_governance_contract_hash";
const CONTRACT_PACKAGE_HASH_KEY: &str = "casper_sentinel_governance_package_hash";
const CONTRACT_ACCESS_UREF_KEY: &str = "casper_sentinel_governance_access_uref";
const OWNER_KEY: &str = "owner";
const RESOLUTIONS_DICT: &str = "resolutions";

const ERROR_UNAUTHORIZED: u16 = 1;
const ERROR_DUPLICATE_PROPOSAL: u16 = 2;
const ERROR_EMPTY_PROPOSAL_ID: u16 = 3;
const ERROR_EMPTY_PROJECT_ID: u16 = 4;
const ERROR_EMPTY_DECISION_HASH: u16 = 5;
const ERROR_INVALID_FINAL_SCORE: u16 = 6;
const ERROR_EMPTY_RECOMMENDATION: u16 = 7;
const ERROR_EMPTY_TIMESTAMP: u16 = 8;

fn revert(code: u16) -> ! {
    runtime::revert(ApiError::User(code))
}

fn get_owner() -> AccountHash {
    let owner_uref: URef = runtime::get_key(OWNER_KEY)
        .unwrap_or_revert()
        .into_uref()
        .unwrap_or_revert();

    storage::read(owner_uref)
        .unwrap_or_revert()
        .unwrap_or_revert()
}

fn assert_owner() {
    if runtime::get_caller() != get_owner() {
        revert(ERROR_UNAUTHORIZED);
    }
}

fn get_resolutions_uref() -> URef {
    runtime::get_key(RESOLUTIONS_DICT)
        .unwrap_or_revert()
        .into_uref()
        .unwrap_or_revert()
}

fn escape_json(value: &str) -> String {
    value.replace('\\', "\\\\").replace('"', "\\\"")
}

fn build_resolution_json(
    proposal_id: &str,
    project_id: &str,
    decision_hash: &str,
    final_score: u8,
    recommendation: &str,
    timestamp: &str,
    recorded_by: AccountHash,
) -> String {
    format!(
        "{{\"proposal_id\":\"{}\",\"project_id\":\"{}\",\"decision_hash\":\"{}\",\"final_score\":{},\"recommendation\":\"{}\",\"timestamp\":\"{}\",\"recorded_by\":\"{:?}\"}}",
        escape_json(proposal_id),
        escape_json(project_id),
        escape_json(decision_hash),
        final_score,
        escape_json(recommendation),
        escape_json(timestamp),
        recorded_by
    )
}

#[no_mangle]
pub extern "C" fn record_resolution() {
    assert_owner();

    let proposal_id: String = runtime::get_named_arg("proposal_id");
    let project_id: String = runtime::get_named_arg("project_id");
    let decision_hash: String = runtime::get_named_arg("decision_hash");
    let final_score: u8 = runtime::get_named_arg("final_score");
    let recommendation: String = runtime::get_named_arg("recommendation");
    let timestamp: String = runtime::get_named_arg("timestamp");

    if proposal_id.is_empty() {
        revert(ERROR_EMPTY_PROPOSAL_ID);
    }
    if project_id.is_empty() {
        revert(ERROR_EMPTY_PROJECT_ID);
    }
    if decision_hash.is_empty() {
        revert(ERROR_EMPTY_DECISION_HASH);
    }
    if final_score > 100 {
        revert(ERROR_INVALID_FINAL_SCORE);
    }
    if recommendation.is_empty() {
        revert(ERROR_EMPTY_RECOMMENDATION);
    }
    if timestamp.is_empty() {
        revert(ERROR_EMPTY_TIMESTAMP);
    }

    let resolutions = get_resolutions_uref();
    let existing: Option<String> =
        storage::dictionary_get(resolutions, &proposal_id).unwrap_or_revert();

    if existing.is_some() {
        revert(ERROR_DUPLICATE_PROPOSAL);
    }

    let resolution = build_resolution_json(
        &proposal_id,
        &project_id,
        &decision_hash,
        final_score,
        &recommendation,
        &timestamp,
        runtime::get_caller(),
    );

    storage::dictionary_put(resolutions, &proposal_id, resolution);
}

#[no_mangle]
pub extern "C" fn get_resolution() {
    let proposal_id: String = runtime::get_named_arg("proposal_id");
    let resolutions = get_resolutions_uref();
    let value: Option<String> =
        storage::dictionary_get(resolutions, &proposal_id).unwrap_or_revert();

    runtime::ret(CLValue::from_t(value.unwrap_or_default()).unwrap_or_revert());
}

#[no_mangle]
pub extern "C" fn resolution_exists() {
    let proposal_id: String = runtime::get_named_arg("proposal_id");
    let resolutions = get_resolutions_uref();
    let value: Option<String> =
        storage::dictionary_get(resolutions, &proposal_id).unwrap_or_revert();

    runtime::ret(CLValue::from_t(value.is_some()).unwrap_or_revert());
}

fn entry_points() -> EntryPoints {
    let mut entry_points = EntryPoints::new();

    entry_points.add_entry_point(EntryPoint::new(
        "record_resolution",
        vec![
            Parameter::new("proposal_id", CLType::String),
            Parameter::new("project_id", CLType::String),
            Parameter::new("decision_hash", CLType::String),
            Parameter::new("final_score", CLType::U8),
            Parameter::new("recommendation", CLType::String),
            Parameter::new("timestamp", CLType::String),
        ],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Contract,
        EntryPointPayment::Caller,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "get_resolution",
        vec![Parameter::new("proposal_id", CLType::String)],
        CLType::String,
        EntryPointAccess::Public,
        EntryPointType::Contract,
        EntryPointPayment::Caller,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "resolution_exists",
        vec![Parameter::new("proposal_id", CLType::String)],
        CLType::Bool,
        EntryPointAccess::Public,
        EntryPointType::Contract,
        EntryPointPayment::Caller,
    ));

    entry_points
}

#[no_mangle]
pub extern "C" fn call() {
    let owner = storage::new_uref(runtime::get_caller());
    let resolutions = storage::new_dictionary(RESOLUTIONS_DICT).unwrap_or_revert();

    let mut named_keys = NamedKeys::new();
    named_keys.insert(OWNER_KEY.into(), Key::URef(owner));
    named_keys.insert(RESOLUTIONS_DICT.into(), Key::URef(resolutions));

    let (contract_hash, _contract_version) = storage::new_contract(
        entry_points(),
        Some(named_keys),
        Some(CONTRACT_PACKAGE_HASH_KEY.into()),
        Some(CONTRACT_ACCESS_UREF_KEY.into()),
    );

    runtime::put_key(CONTRACT_HASH_KEY, contract_hash.into());
}
