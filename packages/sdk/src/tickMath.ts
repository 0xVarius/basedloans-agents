// Port of Uniswap V3 TickMath.getSqrtRatioAtTick (bigint, exact).
export const MIN_TICK = -887272
export const MAX_TICK = 887272
export const Q96 = 2n ** 96n
const MAX_UINT256 = 2n ** 256n - 1n

export function getSqrtRatioAtTick(tick: number): bigint {
  if (!Number.isInteger(tick) || tick < MIN_TICK || tick > MAX_TICK) throw new Error(`tick out of range: ${tick}`)
  const absTick = BigInt(Math.abs(tick))
  let ratio =
    (absTick & 0x1n) !== 0n ? 0xfffcb933bd6fad37aa2d162d1a594001n : 0x100000000000000000000000000000000n
  const mul = (r: bigint, c: bigint) => (r * c) >> 128n
  if ((absTick & 0x2n) !== 0n) ratio = mul(ratio, 0xfff97272373d413259a46990580e213an)
  if ((absTick & 0x4n) !== 0n) ratio = mul(ratio, 0xfff2e50f5f656932ef12357cf3c7fdccn)
  if ((absTick & 0x8n) !== 0n) ratio = mul(ratio, 0xffe5caca7e10e4e61c3624eaa0941cd0n)
  if ((absTick & 0x10n) !== 0n) ratio = mul(ratio, 0xffcb9843d60f6159c9db58835c926644n)
  if ((absTick & 0x20n) !== 0n) ratio = mul(ratio, 0xff973b41fa98c081472e6896dfb254c0n)
  if ((absTick & 0x40n) !== 0n) ratio = mul(ratio, 0xff2ea16466c96a3843ec78b326b52861n)
  if ((absTick & 0x80n) !== 0n) ratio = mul(ratio, 0xfe5dee046a99a2a811c461f1969c3053n)
  if ((absTick & 0x100n) !== 0n) ratio = mul(ratio, 0xfcbe86c7900a88aedcffc83b479aa3a4n)
  if ((absTick & 0x200n) !== 0n) ratio = mul(ratio, 0xf987a7253ac413176f2b074cf7815e54n)
  if ((absTick & 0x400n) !== 0n) ratio = mul(ratio, 0xf3392b0822b70005940c7a398e4b70f3n)
  if ((absTick & 0x800n) !== 0n) ratio = mul(ratio, 0xe7159475a2c29b7443b29c7fa6e889d9n)
  if ((absTick & 0x1000n) !== 0n) ratio = mul(ratio, 0xd097f3bdfd2022b8845ad8f792aa5825n)
  if ((absTick & 0x2000n) !== 0n) ratio = mul(ratio, 0xa9f746462d870fdf8a65dc1f90e061e5n)
  if ((absTick & 0x4000n) !== 0n) ratio = mul(ratio, 0x70d869a156d2a1b890bb3df62baf32f7n)
  if ((absTick & 0x8000n) !== 0n) ratio = mul(ratio, 0x31be135f97d08fd981231505542fcfa6n)
  if ((absTick & 0x10000n) !== 0n) ratio = mul(ratio, 0x9aa508b5b7a84e1c677de54f3e99bc9n)
  if ((absTick & 0x20000n) !== 0n) ratio = mul(ratio, 0x5d6af8dedb81196699c329225ee604n)
  if ((absTick & 0x40000n) !== 0n) ratio = mul(ratio, 0x2216e584f5fa1ea926041bedfe98n)
  if ((absTick & 0x80000n) !== 0n) ratio = mul(ratio, 0x48a170391f7dc42444e8fa2n)
  if (tick > 0) ratio = MAX_UINT256 / ratio
  return (ratio >> 32n) + (ratio % (1n << 32n) === 0n ? 0n : 1n)
}
