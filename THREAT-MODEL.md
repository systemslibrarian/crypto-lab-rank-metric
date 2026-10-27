# Teaching model and security boundary

## Implemented parties and observations

There is no protocol adversary in this repository. A learner chooses a two-symbol message and one of
three fixed error vectors. The application encodes the message, adds the error in `GF(16)^4`, and
exposes the transmitted word, error, received word, error weights, decoder decision, and independent
re-encoding check.

The decoder observes the complete received word and the complete 256-word codebook. It returns the
unique codeword at rank distance at most one or refuses. The UI's omniscient teaching view is
intentional and must not be interpreted as an attacker interface in a cryptosystem.

## Guaranteed behavior

For the implemented `[4,2,3]` code, exhaustive enumeration establishes minimum rank distance 3.
Therefore a received word produced by adding an error of rank at most one has exactly one
transmitted codeword within radius one. Unit tests verify this for every codeword and every
rank-zero/rank-one error.

## Explicitly unguaranteed behavior

For error rank two or greater, this decoder may refuse or may return a different codeword. The
learner controls execute both outcomes and label the latter a miscorrection. Neither outcome is an
attack detector, integrity check, or cryptographic authenticity result.

## Historical construction boundary

The page does not instantiate GPT, Faure–Loidreau, RQC, Classic McEliece, or HQC. Public exposure of
structured rank codes introduces questions absent from a private coding exercise; the cited
Faure–Loidreau work is one concrete example. NIST IR 8309's assessment of the submitted RQC
parameters is reported as a dated construction-specific record, not as a theorem that all
rank-metric ideas fail.
