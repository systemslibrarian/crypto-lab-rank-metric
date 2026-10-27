# Limitations

The lesson is deliberately finite and inspectable. Its claims stop at the following boundaries:

- The field is `GF(16)` and the code has only 256 words. These are not secure parameters.
- Exhaustive search is used for decoding. The lesson does not implement or benchmark an efficient
  Gabidulin decoder.
- The radius-one guarantee is a coding statement: every rank error of weight at most one has a
  unique nearest codeword. It does not promise detection, refusal, or correction for rank-two
  errors.
- The complete rank-two census belongs only to this `[4,2,3]` code and decoder. It is not a general
  distribution or attack success rate.
- No encryption, key encapsulation, authentication, protocol, key management, randomness, or
  deployment is implemented.
- Maximum rank distance does not imply that a public-key construction exposing a structured code is
  secure. Scheme-specific transformations, assumptions, parameters, and cryptanalysis remain
  necessary.
- The implementation is ordinary TypeScript and makes no constant-time or side-channel claim.
- The page names RQC's status from NIST IR 8309 (2020); it is not a continuously updated survey of
  every later rank-code proposal.

The binary matrix uses the declared polynomial basis `(1, α, α², α³)`. Changing bases changes the
displayed coordinates but not the rank weight, provided the change is an invertible base-field
transformation; this lesson does not provide a basis-change control.
