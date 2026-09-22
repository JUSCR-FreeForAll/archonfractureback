// Proves that a private intention hash matches the public loop purpose
// commitment and remains valid beyond the public current time.
fn main(
    intention_hash: Field,
    expires: u64,
    loop_purpose_commitment: pub Field,
    current_time: pub u64
) {
    assert(expires > current_time);
    assert(intention_hash == loop_purpose_commitment);
}
