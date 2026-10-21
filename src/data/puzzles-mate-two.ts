import type {MateTwoSolution} from '../core/mate-two';
export interface MateTwoPuzzle {id:string;fen:string;sideToMove:'white'|'black';boardOrientation:'white'|'black';solution:MateTwoSolution}
export const MATE_TWO_PUZZLES:MateTwoPuzzle[] = [
  {
    "id": "M2-001",
    "fen": "8/8/8/8/8/PkNR4/3K2Q1/8 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "d2c1",
      "firstSan": "Kc1",
      "branches": [
        {
          "replyUci": "b3a3",
          "replySan": "Kxa3",
          "winningUcis": [
            "g2b2"
          ],
          "winningSans": [
            "Qb2#"
          ]
        },
        {
          "replyUci": "b3c4",
          "replySan": "Kc4",
          "winningUcis": [
            "g2d5"
          ],
          "winningSans": [
            "Qd5#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-002",
    "fen": "8/8/4R3/1kp5/3p3Q/P1BP4/1P1N1P1P/2K5 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "b2b3",
      "firstSan": "b3",
      "branches": [
        {
          "replyUci": "d4c3",
          "replySan": "dxc3",
          "winningUcis": [
            "h4a4"
          ],
          "winningSans": [
            "Qa4#"
          ]
        },
        {
          "replyUci": "c5c4",
          "replySan": "c4",
          "winningUcis": [
            "h4g5",
            "h4h5"
          ],
          "winningSans": [
            "Qg5#",
            "Qh5#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-003",
    "fen": "r4r2/pnp4R/1p3N1R/1P2Ppk1/1qPP1pp1/3Q1P2/1B4K1/8 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "h6h5",
      "firstSan": "Rh5+",
      "branches": [
        {
          "replyUci": "g5g6",
          "replySan": "Kg6",
          "winningUcis": [
            "d3f5"
          ],
          "winningSans": [
            "Qxf5#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-004",
    "fen": "7R/1p2rr2/p6p/6pk/2P1bP2/2P3RP/P4P1K/4Q3 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "g3g5",
      "firstSan": "Rxg5+",
      "branches": [
        {
          "replyUci": "h5h4",
          "replySan": "Kh4",
          "winningUcis": [
            "f2f3",
            "h8h6"
          ],
          "winningSans": [
            "f3#",
            "Rxh6#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-005",
    "fen": "2r3k1/p4p1p/4pqpP/3pP1P1/1P1BnP1K/8/2r5/Q2R2R1 b - - 0 1",
    "sideToMove": "black",
    "boardOrientation": "black",
    "solution": {
      "firstUci": "f6f4",
      "firstSan": "Qxf4+",
      "branches": [
        {
          "replyUci": "g1g4",
          "replySan": "Rg4",
          "winningUcis": [
            "c2h2",
            "f4h2"
          ],
          "winningSans": [
            "Rh2#",
            "Qh2#"
          ]
        },
        {
          "replyUci": "h4h3",
          "replySan": "Kh3",
          "winningUcis": [
            "c2h2"
          ],
          "winningSans": [
            "Rh2#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-006",
    "fen": "2bq3k/r1N1N1r1/p3pQ2/2p4p/8/3B4/P2B1PPP/4R1K1 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "f6h6",
      "firstSan": "Qh6+",
      "branches": [
        {
          "replyUci": "g7h7",
          "replySan": "Rh7",
          "winningUcis": [
            "h6h7"
          ],
          "winningSans": [
            "Qxh7#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-007",
    "fen": "8/5p1k/p5rp/5Q2/2pBp2q/8/2R2P1P/2R2K2 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "f5f7",
      "firstSan": "Qxf7+",
      "branches": [
        {
          "replyUci": "g6g7",
          "replySan": "Rg7",
          "winningUcis": [
            "f7g7"
          ],
          "winningSans": [
            "Qxg7#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-008",
    "fen": "8/8/8/8/6r1/6kp/8/6K1 b - - 0 1",
    "sideToMove": "black",
    "boardOrientation": "black",
    "solution": {
      "firstUci": "g4f4",
      "firstSan": "Rf4",
      "branches": [
        {
          "replyUci": "g1h1",
          "replySan": "Kh1",
          "winningUcis": [
            "f4f1"
          ],
          "winningSans": [
            "Rf1#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-009",
    "fen": "7r/1Np1np1p/5kp1/KQ1rp3/6b1/2P1P3/5P2/3q4 b - - 0 1",
    "sideToMove": "black",
    "boardOrientation": "black",
    "solution": {
      "firstUci": "e7c6",
      "firstSan": "Nc6+",
      "branches": [
        {
          "replyUci": "a5a6",
          "replySan": "Ka6",
          "winningUcis": [
            "h8a8"
          ],
          "winningSans": [
            "Ra8#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-010",
    "fen": "5Q2/7k/8/4KR2/8/8/8/8 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "f8f7",
      "firstSan": "Qf7+",
      "branches": [
        {
          "replyUci": "h7h6",
          "replySan": "Kh6",
          "winningUcis": [
            "f5h5"
          ],
          "winningSans": [
            "Rh5#"
          ]
        },
        {
          "replyUci": "h7h8",
          "replySan": "Kh8",
          "winningUcis": [
            "f5h5"
          ],
          "winningSans": [
            "Rh5#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-011",
    "fen": "5k2/8/5KR1/8/1p1B4/1P3P2/6PP/8 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "f6e6",
      "firstSan": "Ke6",
      "branches": [
        {
          "replyUci": "f8e8",
          "replySan": "Ke8",
          "winningUcis": [
            "g6g8"
          ],
          "winningSans": [
            "Rg8#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-012",
    "fen": "r7/pp4kp/2pp2q1/5p2/1P6/P1P3N1/4r3/6K1 b - - 0 1",
    "sideToMove": "black",
    "boardOrientation": "black",
    "solution": {
      "firstUci": "g6g3",
      "firstSan": "Qxg3+",
      "branches": [
        {
          "replyUci": "g1f1",
          "replySan": "Kf1",
          "winningUcis": [
            "e2e1",
            "g3e1",
            "g3f2",
            "g3g2"
          ],
          "winningSans": [
            "Re1#",
            "Qe1#",
            "Qf2#",
            "Qg2#"
          ]
        },
        {
          "replyUci": "g1h1",
          "replySan": "Kh1",
          "winningUcis": [
            "e2e1",
            "e2h2",
            "g3e1",
            "g3g2",
            "g3h2"
          ],
          "winningSans": [
            "Re1#",
            "Rh2#",
            "Qe1#",
            "Qg2#",
            "Qh2#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-013",
    "fen": "4r1k1/pp1R2p1/2p1b1P1/5p2/3PqP1Q/4P3/6PK/8 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "h4h7",
      "firstSan": "Qh7+",
      "branches": [
        {
          "replyUci": "g8f8",
          "replySan": "Kf8",
          "winningUcis": [
            "h7g7"
          ],
          "winningSans": [
            "Qxg7#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-014",
    "fen": "8/8/p7/P7/K7/8/2k2pq1/8 b - - 0 1",
    "sideToMove": "black",
    "boardOrientation": "black",
    "solution": {
      "firstUci": "g2b7",
      "firstSan": "Qb7",
      "branches": [
        {
          "replyUci": "a4a3",
          "replySan": "Ka3",
          "winningUcis": [
            "b7b3"
          ],
          "winningSans": [
            "Qb3#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-015",
    "fen": "8/pp1k1pp1/3p3p/1K6/4q3/4PP2/b4P1P/3Br2R b - - 0 1",
    "sideToMove": "black",
    "boardOrientation": "black",
    "solution": {
      "firstUci": "e4c4",
      "firstSan": "Qc4+",
      "branches": [
        {
          "replyUci": "b5a5",
          "replySan": "Ka5",
          "winningUcis": [
            "b7b6"
          ],
          "winningSans": [
            "b6#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-016",
    "fen": "8/p4kp1/P7/1p4PK/3q4/8/2p5/8 b - - 0 1",
    "sideToMove": "black",
    "boardOrientation": "black",
    "solution": {
      "firstUci": "g7g6",
      "firstSan": "g6+",
      "branches": [
        {
          "replyUci": "h5h6",
          "replySan": "Kh6",
          "winningUcis": [
            "d4h4",
            "d4g7",
            "d4h8"
          ],
          "winningSans": [
            "Qh4#",
            "Qg7#",
            "Qh8#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-017",
    "fen": "5Bk1/5p1p/1p4pK/n1p5/Q7/P5q1/1P6/2R5 b - - 0 1",
    "sideToMove": "black",
    "boardOrientation": "black",
    "solution": {
      "firstUci": "g3e3",
      "firstSan": "Qe3+",
      "branches": [
        {
          "replyUci": "a4f4",
          "replySan": "Qf4",
          "winningUcis": [
            "e3f4"
          ],
          "winningSans": [
            "Qxf4#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-018",
    "fen": "6r1/5k2/1pp2r2/7K/p1N5/P1P5/1P3b1P/R3R3 b - - 0 1",
    "sideToMove": "black",
    "boardOrientation": "black",
    "solution": {
      "firstUci": "f6f5",
      "firstSan": "Rf5+",
      "branches": [
        {
          "replyUci": "h5h6",
          "replySan": "Kh6",
          "winningUcis": [
            "g8h8"
          ],
          "winningSans": [
            "Rh8#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-019",
    "fen": "5k2/p5r1/3q1p1Q/1pNB4/2p5/6P1/PP3P1P/4RRK1 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "h6h8",
      "firstSan": "Qh8+",
      "branches": [
        {
          "replyUci": "g7g8",
          "replySan": "Rg8",
          "winningUcis": [
            "h8g8"
          ],
          "winningSans": [
            "Qxg8#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-020",
    "fen": "3rb3/qp2b2p/p7/2Pp3k/1P3Q2/3B3P/P5PK/6N1 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "g2g4",
      "firstSan": "g4+",
      "branches": [
        {
          "replyUci": "h5h4",
          "replySan": "Kh4",
          "winningUcis": [
            "g1f3"
          ],
          "winningSans": [
            "Nf3#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-021",
    "fen": "2k5/p1r2p2/Pp2p2n/1Qb4p/4qPpn/2P3P1/8/1RBB1K2 b - - 0 1",
    "sideToMove": "black",
    "boardOrientation": "black",
    "solution": {
      "firstUci": "e4g2",
      "firstSan": "Qg2+",
      "branches": [
        {
          "replyUci": "f1e1",
          "replySan": "Ke1",
          "winningUcis": [
            "g2f2"
          ],
          "winningSans": [
            "Qf2#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-022",
    "fen": "r3k1r1/p4p2/1p1pq3/2p5/P3p3/1P3nR1/7P/7K b q - 0 1",
    "sideToMove": "black",
    "boardOrientation": "black",
    "solution": {
      "firstUci": "g8g3",
      "firstSan": "Rxg3",
      "branches": [
        {
          "replyUci": "h2g3",
          "replySan": "hxg3",
          "winningUcis": [
            "e6h3"
          ],
          "winningSans": [
            "Qh3#"
          ]
        },
        {
          "replyUci": "h2h3",
          "replySan": "h3",
          "winningUcis": [
            "g3g1",
            "e6h3"
          ],
          "winningSans": [
            "Rg1#",
            "Qxh3#"
          ]
        },
        {
          "replyUci": "h2h4",
          "replySan": "h4",
          "winningUcis": [
            "g3g1",
            "e6h3"
          ],
          "winningSans": [
            "Rg1#",
            "Qh3#"
          ]
        },
        {
          "replyUci": "b3b4",
          "replySan": "b4",
          "winningUcis": [
            "g3g1"
          ],
          "winningSans": [
            "Rg1#"
          ]
        },
        {
          "replyUci": "a4a5",
          "replySan": "a5",
          "winningUcis": [
            "g3g1"
          ],
          "winningSans": [
            "Rg1#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-023",
    "fen": "6k1/ppb1p2p/4N1p1/P2Q4/2P5/2q4P/1r4P1/2RKB3 b - - 0 1",
    "sideToMove": "black",
    "boardOrientation": "black",
    "solution": {
      "firstUci": "c3b3",
      "firstSan": "Qb3+",
      "branches": [
        {
          "replyUci": "c1c2",
          "replySan": "Rc2",
          "winningUcis": [
            "b3c2"
          ],
          "winningSans": [
            "Qxc2#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-024",
    "fen": "7k/4K2p/1p1p1N1P/pQ6/2P1p3/1P6/P5q1/8 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "b5e8",
      "firstSan": "Qe8+",
      "branches": [
        {
          "replyUci": "g2g8",
          "replySan": "Qg8",
          "winningUcis": [
            "e8g8"
          ],
          "winningSans": [
            "Qxg8#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-025",
    "fen": "8/4R1p1/5k1p/8/7P/2P2P2/PP1Q4/1K6 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "d2d6",
      "firstSan": "Qd6+",
      "branches": [
        {
          "replyUci": "f6f5",
          "replySan": "Kf5",
          "winningUcis": [
            "e7f7"
          ],
          "winningSans": [
            "Rf7#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-026",
    "fen": "2k5/p2R4/8/8/P6p/4K1P1/4Q3/8 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "e2b5",
      "firstSan": "Qb5",
      "branches": [
        {
          "replyUci": "h4g3",
          "replySan": "hxg3",
          "winningUcis": [
            "b5b7"
          ],
          "winningSans": [
            "Qb7#"
          ]
        },
        {
          "replyUci": "h4h3",
          "replySan": "h3",
          "winningUcis": [
            "b5b7"
          ],
          "winningSans": [
            "Qb7#"
          ]
        },
        {
          "replyUci": "a7a5",
          "replySan": "a5",
          "winningUcis": [
            "b5b7"
          ],
          "winningSans": [
            "Qb7#"
          ]
        },
        {
          "replyUci": "a7a6",
          "replySan": "a6",
          "winningUcis": [
            "b5b7"
          ],
          "winningSans": [
            "Qb7#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-027",
    "fen": "8/5k2/7K/8/8/8/8/5q2 b - - 0 1",
    "sideToMove": "black",
    "boardOrientation": "black",
    "solution": {
      "firstUci": "f1b5",
      "firstSan": "Qb5",
      "branches": [
        {
          "replyUci": "h6h7",
          "replySan": "Kh7",
          "winningUcis": [
            "b5h5"
          ],
          "winningSans": [
            "Qh5#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-028",
    "fen": "2Q3r1/1p2k1pp/p3P3/3p1p1P/1P5q/P7/1BP1NP2/4K3 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "c8d7",
      "firstSan": "Qd7+",
      "branches": [
        {
          "replyUci": "e7f8",
          "replySan": "Kf8",
          "winningUcis": [
            "d7f7"
          ],
          "winningSans": [
            "Qf7#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-029",
    "fen": "2r3k1/1q2R2p/5Q1b/3p4/P7/Np4P1/5P1P/3N2K1 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "f6f7",
      "firstSan": "Qf7+",
      "branches": [
        {
          "replyUci": "g8h8",
          "replySan": "Kh8",
          "winningUcis": [
            "f7h7"
          ],
          "winningSans": [
            "Qxh7#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-030",
    "fen": "8/8/8/8/8/8/4RK1k/8 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "e2e3",
      "firstSan": "Re3",
      "branches": [
        {
          "replyUci": "h2h1",
          "replySan": "Kh1",
          "winningUcis": [
            "e3h3"
          ],
          "winningSans": [
            "Rh3#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-031",
    "fen": "B1R5/5p2/3R4/k3p3/p1P1P1BP/6P1/P4P2/2K5 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "a2a3",
      "firstSan": "a3",
      "branches": [
        {
          "replyUci": "f7f5",
          "replySan": "f5",
          "winningUcis": [
            "c8c5"
          ],
          "winningSans": [
            "Rc5#"
          ]
        },
        {
          "replyUci": "f7f6",
          "replySan": "f6",
          "winningUcis": [
            "c8c5"
          ],
          "winningSans": [
            "Rc5#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-032",
    "fen": "8/k7/2K5/8/8/8/6PP/7Q w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "h1b1",
      "firstSan": "Qb1",
      "branches": [
        {
          "replyUci": "a7a6",
          "replySan": "Ka6",
          "winningUcis": [
            "b1a1",
            "b1a2",
            "b1b6"
          ],
          "winningSans": [
            "Qa1#",
            "Qa2#",
            "Qb6#"
          ]
        },
        {
          "replyUci": "a7a8",
          "replySan": "Ka8",
          "winningUcis": [
            "b1b7"
          ],
          "winningSans": [
            "Qb7#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-033",
    "fen": "5k2/p7/8/2p1p1p1/P1P4p/4q3/7P/7K b - - 0 1",
    "sideToMove": "black",
    "boardOrientation": "black",
    "solution": {
      "firstUci": "h4h3",
      "firstSan": "h3",
      "branches": [
        {
          "replyUci": "a4a5",
          "replySan": "a5",
          "winningUcis": [
            "e3c1",
            "e3e1"
          ],
          "winningSans": [
            "Qc1#",
            "Qe1#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-034",
    "fen": "k4r2/6pp/P1b1K3/Q5r1/5b2/N7/PP3PPP/R4B1R b - - 0 1",
    "sideToMove": "black",
    "boardOrientation": "black",
    "solution": {
      "firstUci": "g5g6",
      "firstSan": "Rg6+",
      "branches": [
        {
          "replyUci": "e6e7",
          "replySan": "Ke7",
          "winningUcis": [
            "f4d6"
          ],
          "winningSans": [
            "Bd6#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-035",
    "fen": "8/8/6P1/5K1k/R7/8/8/8 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "f5f6",
      "firstSan": "Kf6",
      "branches": [
        {
          "replyUci": "h5h6",
          "replySan": "Kh6",
          "winningUcis": [
            "a4h4"
          ],
          "winningSans": [
            "Rh4#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-036",
    "fen": "8/k1K5/8/PP6/8/3R4/1B4p1/8 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "d3d6",
      "firstSan": "Rd6",
      "branches": [
        {
          "replyUci": "g2g1q",
          "replySan": "g1=Q",
          "winningUcis": [
            "d6a6"
          ],
          "winningSans": [
            "Ra6#"
          ]
        },
        {
          "replyUci": "g2g1r",
          "replySan": "g1=R",
          "winningUcis": [
            "d6a6"
          ],
          "winningSans": [
            "Ra6#"
          ]
        },
        {
          "replyUci": "g2g1b",
          "replySan": "g1=B",
          "winningUcis": [
            "d6a6"
          ],
          "winningSans": [
            "Ra6#"
          ]
        },
        {
          "replyUci": "g2g1n",
          "replySan": "g1=N",
          "winningUcis": [
            "d6a6"
          ],
          "winningSans": [
            "Ra6#"
          ]
        },
        {
          "replyUci": "a7a8",
          "replySan": "Ka8",
          "winningUcis": [
            "d6a6"
          ],
          "winningSans": [
            "Ra6#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-037",
    "fen": "7k/2p5/1Q3P2/2p3p1/3p2P1/2P3P1/8/6K1 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "b6c7",
      "firstSan": "Qxc7",
      "branches": [
        {
          "replyUci": "d4c3",
          "replySan": "dxc3",
          "winningUcis": [
            "c7g7"
          ],
          "winningSans": [
            "Qg7#"
          ]
        },
        {
          "replyUci": "d4d3",
          "replySan": "d3",
          "winningUcis": [
            "c7g7"
          ],
          "winningSans": [
            "Qg7#"
          ]
        },
        {
          "replyUci": "c5c4",
          "replySan": "c4",
          "winningUcis": [
            "c7g7"
          ],
          "winningSans": [
            "Qg7#"
          ]
        },
        {
          "replyUci": "h8g8",
          "replySan": "Kg8",
          "winningUcis": [
            "c7g7"
          ],
          "winningSans": [
            "Qg7#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-038",
    "fen": "5r1k/2R3R1/8/1N4pp/8/P3P2P/1P3PP1/6K1 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "g7h7",
      "firstSan": "Rh7+",
      "branches": [
        {
          "replyUci": "h8g8",
          "replySan": "Kg8",
          "winningUcis": [
            "c7g7"
          ],
          "winningSans": [
            "Rcg7#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-039",
    "fen": "7k/7p/3p2p1/3Qp3/3pP2P/4RPq1/1rP5/n6K b - - 0 1",
    "sideToMove": "black",
    "boardOrientation": "black",
    "solution": {
      "firstUci": "b2b1",
      "firstSan": "Rb1+",
      "branches": [
        {
          "replyUci": "e3e1",
          "replySan": "Re1",
          "winningUcis": [
            "b1e1"
          ],
          "winningSans": [
            "Rxe1#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-040",
    "fen": "1q1rr3/p2Rpk1B/1pnp3Q/7p/2P1P3/1P4P1/P6P/6K1 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "h6g6",
      "firstSan": "Qg6+",
      "branches": [
        {
          "replyUci": "f7f8",
          "replySan": "Kf8",
          "winningUcis": [
            "g6g8"
          ],
          "winningSans": [
            "Qg8#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-041",
    "fen": "8/5Q2/8/6p1/7k/4R3/4K3/8 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "f7e6",
      "firstSan": "Qe6",
      "branches": [
        {
          "replyUci": "h4h5",
          "replySan": "Kh5",
          "winningUcis": [
            "e3h3"
          ],
          "winningSans": [
            "Rh3#"
          ]
        },
        {
          "replyUci": "g5g4",
          "replySan": "g4",
          "winningUcis": [
            "e6h6"
          ],
          "winningSans": [
            "Qh6#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-042",
    "fen": "1Q3r1k/6pp/7n/3r4/2p1P3/P1K5/4B2P/1qB3R1 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "b8f8",
      "firstSan": "Qxf8+",
      "branches": [
        {
          "replyUci": "h6g8",
          "replySan": "Ng8",
          "winningUcis": [
            "f8g7"
          ],
          "winningSans": [
            "Qxg7#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-043",
    "fen": "2r1b3/1p1k4/p1p1pQ2/1B5p/3q3P/6B1/P5P1/5R1K w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "f6d4",
      "firstSan": "Qxd4+",
      "branches": [
        {
          "replyUci": "d7e7",
          "replySan": "Ke7",
          "winningUcis": [
            "d4d6"
          ],
          "winningSans": [
            "Qd6#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-044",
    "fen": "2N2k2/pp2n2R/6p1/8/3p1p2/3P2P1/1PKQ2B1/q4r1R b - - 0 1",
    "sideToMove": "black",
    "boardOrientation": "black",
    "solution": {
      "firstUci": "a1a4",
      "firstSan": "Qa4+",
      "branches": [
        {
          "replyUci": "b2b3",
          "replySan": "b3",
          "winningUcis": [
            "a4a2"
          ],
          "winningSans": [
            "Qa2#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-045",
    "fen": "8/8/4pk1q/2P3p1/R5P1/4n1K1/3r4/8 b - - 0 1",
    "sideToMove": "black",
    "boardOrientation": "black",
    "solution": {
      "firstUci": "e3f1",
      "firstSan": "Nf1+",
      "branches": [
        {
          "replyUci": "g3f3",
          "replySan": "Kf3",
          "winningUcis": [
            "h6h1"
          ],
          "winningSans": [
            "Qh1#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-046",
    "fen": "8/pN4pp/2P2p2/3r3P/6P1/P3kn2/8/5K2 b - - 0 1",
    "sideToMove": "black",
    "boardOrientation": "black",
    "solution": {
      "firstUci": "d5d2",
      "firstSan": "Rd2",
      "branches": [
        {
          "replyUci": "a3a4",
          "replySan": "a4",
          "winningUcis": [
            "d2f2"
          ],
          "winningSans": [
            "Rf2#"
          ]
        },
        {
          "replyUci": "g4g5",
          "replySan": "g5",
          "winningUcis": [
            "d2f2"
          ],
          "winningSans": [
            "Rf2#"
          ]
        },
        {
          "replyUci": "h5h6",
          "replySan": "h6",
          "winningUcis": [
            "d2f2"
          ],
          "winningSans": [
            "Rf2#"
          ]
        },
        {
          "replyUci": "c6c7",
          "replySan": "c7",
          "winningUcis": [
            "d2f2"
          ],
          "winningSans": [
            "Rf2#"
          ]
        },
        {
          "replyUci": "b7a5",
          "replySan": "Na5",
          "winningUcis": [
            "d2f2"
          ],
          "winningSans": [
            "Rf2#"
          ]
        },
        {
          "replyUci": "b7c5",
          "replySan": "Nc5",
          "winningUcis": [
            "d2f2"
          ],
          "winningSans": [
            "Rf2#"
          ]
        },
        {
          "replyUci": "b7d6",
          "replySan": "Nd6",
          "winningUcis": [
            "d2f2"
          ],
          "winningSans": [
            "Rf2#"
          ]
        },
        {
          "replyUci": "b7d8",
          "replySan": "Nd8",
          "winningUcis": [
            "d2f2"
          ],
          "winningSans": [
            "Rf2#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-047",
    "fen": "8/4R3/7p/8/8/2KB3r/2N5/1k6 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "e7e1",
      "firstSan": "Re1+",
      "branches": [
        {
          "replyUci": "b1a2",
          "replySan": "Ka2",
          "winningUcis": [
            "e1a1"
          ],
          "winningSans": [
            "Ra1#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-048",
    "fen": "8/1p3p2/1b5p/5b1P/q3k3/8/6K1/8 b - - 0 1",
    "sideToMove": "black",
    "boardOrientation": "black",
    "solution": {
      "firstUci": "a4d4",
      "firstSan": "Qd4",
      "branches": [
        {
          "replyUci": "g2f1",
          "replySan": "Kf1",
          "winningUcis": [
            "d4f2"
          ],
          "winningSans": [
            "Qf2#"
          ]
        },
        {
          "replyUci": "g2h1",
          "replySan": "Kh1",
          "winningUcis": [
            "d4g1"
          ],
          "winningSans": [
            "Qg1#"
          ]
        },
        {
          "replyUci": "g2h2",
          "replySan": "Kh2",
          "winningUcis": [
            "d4g1"
          ],
          "winningSans": [
            "Qg1#"
          ]
        },
        {
          "replyUci": "g2g3",
          "replySan": "Kg3",
          "winningUcis": [
            "d4f2"
          ],
          "winningSans": [
            "Qf2#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-049",
    "fen": "8/5pk1/1Q6/5P2/3K1PP1/6nR/8/8 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "b6h6",
      "firstSan": "Qh6+",
      "branches": [
        {
          "replyUci": "g7g8",
          "replySan": "Kg8",
          "winningUcis": [
            "h6h8"
          ],
          "winningSans": [
            "Qh8#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-050",
    "fen": "1k1rb3/p6R/1p3q2/Q7/4B3/P2pP3/KP3P2/8 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "a5a7",
      "firstSan": "Qxa7+",
      "branches": [
        {
          "replyUci": "b8c8",
          "replySan": "Kc8",
          "winningUcis": [
            "e4b7",
            "a7b7",
            "a7c7",
            "a7a8",
            "h7c7"
          ],
          "winningSans": [
            "Bb7#",
            "Qb7#",
            "Qc7#",
            "Qa8#",
            "Rc7#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-051",
    "fen": "1k6/8/8/pp1n1r2/8/q7/8/1K6 b - - 0 1",
    "sideToMove": "black",
    "boardOrientation": "black",
    "solution": {
      "firstUci": "f5f1",
      "firstSan": "Rf1+",
      "branches": [
        {
          "replyUci": "b1c2",
          "replySan": "Kc2",
          "winningUcis": [
            "a3c3"
          ],
          "winningSans": [
            "Qc3#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-052",
    "fen": "3r2k1/ppp5/7P/r4Q2/2nP1P2/1qP2N2/1P2R2P/2K5 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "f5g6",
      "firstSan": "Qg6+",
      "branches": [
        {
          "replyUci": "g8f8",
          "replySan": "Kf8",
          "winningUcis": [
            "g6g7"
          ],
          "winningSans": [
            "Qg7#"
          ]
        },
        {
          "replyUci": "g8h8",
          "replySan": "Kh8",
          "winningUcis": [
            "g6g7"
          ],
          "winningSans": [
            "Qg7#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-053",
    "fen": "6k1/8/2Q2P2/3p2K1/8/8/8/8 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "g5g6",
      "firstSan": "Kg6",
      "branches": [
        {
          "replyUci": "d5d4",
          "replySan": "d4",
          "winningUcis": [
            "c6a8",
            "c6c8",
            "c6e8"
          ],
          "winningSans": [
            "Qa8#",
            "Qc8#",
            "Qe8#"
          ]
        },
        {
          "replyUci": "g8f8",
          "replySan": "Kf8",
          "winningUcis": [
            "c6a8",
            "c6c8"
          ],
          "winningSans": [
            "Qa8#",
            "Qc8#"
          ]
        },
        {
          "replyUci": "g8h8",
          "replySan": "Kh8",
          "winningUcis": [
            "c6a8",
            "c6c8",
            "c6e8"
          ],
          "winningSans": [
            "Qa8#",
            "Qc8#",
            "Qe8#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-054",
    "fen": "7k/3bpR2/1n5B/2pp3p/1pP5/pP5P/P2Q2P1/5RK1 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "d2g5",
      "firstSan": "Qg5",
      "branches": [
        {
          "replyUci": "d5c4",
          "replySan": "dxc4",
          "winningUcis": [
            "g5g7"
          ],
          "winningSans": [
            "Qg7#"
          ]
        },
        {
          "replyUci": "d5d4",
          "replySan": "d4",
          "winningUcis": [
            "g5g7"
          ],
          "winningSans": [
            "Qg7#"
          ]
        },
        {
          "replyUci": "h5h4",
          "replySan": "h4",
          "winningUcis": [
            "g5g7"
          ],
          "winningSans": [
            "Qg7#"
          ]
        },
        {
          "replyUci": "b6a4",
          "replySan": "Na4",
          "winningUcis": [
            "g5g7"
          ],
          "winningSans": [
            "Qg7#"
          ]
        },
        {
          "replyUci": "b6c4",
          "replySan": "Nxc4",
          "winningUcis": [
            "g5g7"
          ],
          "winningSans": [
            "Qg7#"
          ]
        },
        {
          "replyUci": "b6a8",
          "replySan": "Na8",
          "winningUcis": [
            "g5g7"
          ],
          "winningSans": [
            "Qg7#"
          ]
        },
        {
          "replyUci": "b6c8",
          "replySan": "Nc8",
          "winningUcis": [
            "g5g7"
          ],
          "winningSans": [
            "Qg7#"
          ]
        },
        {
          "replyUci": "d7h3",
          "replySan": "Bxh3",
          "winningUcis": [
            "g5g7"
          ],
          "winningSans": [
            "Qg7#"
          ]
        },
        {
          "replyUci": "d7a4",
          "replySan": "Ba4",
          "winningUcis": [
            "g5g7"
          ],
          "winningSans": [
            "Qg7#"
          ]
        },
        {
          "replyUci": "d7g4",
          "replySan": "Bg4",
          "winningUcis": [
            "g5g7"
          ],
          "winningSans": [
            "Qg7#"
          ]
        },
        {
          "replyUci": "d7b5",
          "replySan": "Bb5",
          "winningUcis": [
            "g5g7"
          ],
          "winningSans": [
            "Qg7#"
          ]
        },
        {
          "replyUci": "d7f5",
          "replySan": "Bf5",
          "winningUcis": [
            "g5g7"
          ],
          "winningSans": [
            "Qg7#"
          ]
        },
        {
          "replyUci": "d7c6",
          "replySan": "Bc6",
          "winningUcis": [
            "g5g7"
          ],
          "winningSans": [
            "Qg7#"
          ]
        },
        {
          "replyUci": "d7e6",
          "replySan": "Be6",
          "winningUcis": [
            "g5g7"
          ],
          "winningSans": [
            "Qg7#"
          ]
        },
        {
          "replyUci": "d7c8",
          "replySan": "Bc8",
          "winningUcis": [
            "g5g7"
          ],
          "winningSans": [
            "Qg7#"
          ]
        },
        {
          "replyUci": "d7e8",
          "replySan": "Be8",
          "winningUcis": [
            "g5g7"
          ],
          "winningSans": [
            "Qg7#"
          ]
        },
        {
          "replyUci": "e7e5",
          "replySan": "e5",
          "winningUcis": [
            "g5g7"
          ],
          "winningSans": [
            "Qg7#"
          ]
        },
        {
          "replyUci": "e7e6",
          "replySan": "e6",
          "winningUcis": [
            "g5g7"
          ],
          "winningSans": [
            "Qg7#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-055",
    "fen": "8/3P2q1/6k1/8/8/4n3/8/6K1 b - - 0 1",
    "sideToMove": "black",
    "boardOrientation": "black",
    "solution": {
      "firstUci": "g7b2",
      "firstSan": "Qb2",
      "branches": [
        {
          "replyUci": "g1h1",
          "replySan": "Kh1",
          "winningUcis": [
            "b2g2"
          ],
          "winningSans": [
            "Qg2#"
          ]
        },
        {
          "replyUci": "d7d8q",
          "replySan": "d8=Q",
          "winningUcis": [
            "b2g2"
          ],
          "winningSans": [
            "Qg2#"
          ]
        },
        {
          "replyUci": "d7d8r",
          "replySan": "d8=R",
          "winningUcis": [
            "b2g2"
          ],
          "winningSans": [
            "Qg2#"
          ]
        },
        {
          "replyUci": "d7d8b",
          "replySan": "d8=B",
          "winningUcis": [
            "b2g2"
          ],
          "winningSans": [
            "Qg2#"
          ]
        },
        {
          "replyUci": "d7d8n",
          "replySan": "d8=N",
          "winningUcis": [
            "b2g2"
          ],
          "winningSans": [
            "Qg2#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-056",
    "fen": "5R2/3r3k/5p2/1Q6/3p1N2/P2P2P1/4PP2/6K1 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "b5h5",
      "firstSan": "Qh5+",
      "branches": [
        {
          "replyUci": "h7g7",
          "replySan": "Kg7",
          "winningUcis": [
            "f4e6",
            "h5h8"
          ],
          "winningSans": [
            "Ne6#",
            "Qh8#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-057",
    "fen": "4kb1r/1pp2ppp/p3pnq1/8/K7/2P5/PP1nP3/8 b k - 0 1",
    "sideToMove": "black",
    "boardOrientation": "black",
    "solution": {
      "firstUci": "g6c2",
      "firstSan": "Qc2+",
      "branches": [
        {
          "replyUci": "b2b3",
          "replySan": "b3",
          "winningUcis": [
            "c2a2"
          ],
          "winningSans": [
            "Qxa2#"
          ]
        },
        {
          "replyUci": "a4a5",
          "replySan": "Ka5",
          "winningUcis": [
            "d2c4"
          ],
          "winningSans": [
            "Nc4#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-058",
    "fen": "8/7p/1p4pk/8/p2NQ1PP/8/PPP5/2K5 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "e4e7",
      "firstSan": "Qe7",
      "branches": [
        {
          "replyUci": "a4a3",
          "replySan": "a3",
          "winningUcis": [
            "e7f8"
          ],
          "winningSans": [
            "Qf8#"
          ]
        },
        {
          "replyUci": "b6b5",
          "replySan": "b5",
          "winningUcis": [
            "e7f8"
          ],
          "winningSans": [
            "Qf8#"
          ]
        },
        {
          "replyUci": "g6g5",
          "replySan": "g5",
          "winningUcis": [
            "e7g5",
            "e7f6"
          ],
          "winningSans": [
            "Qxg5#",
            "Qf6#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-059",
    "fen": "8/8/8/3pQ3/p2P4/2P3P1/k1b5/2K4R w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "c1c2",
      "firstSan": "Kxc2",
      "branches": [
        {
          "replyUci": "a2a3",
          "replySan": "Ka3",
          "winningUcis": [
            "h1a1"
          ],
          "winningSans": [
            "Ra1#"
          ]
        },
        {
          "replyUci": "a4a3",
          "replySan": "a3",
          "winningUcis": [
            "e5d5"
          ],
          "winningSans": [
            "Qxd5#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-060",
    "fen": "6k1/1Q3pn1/7K/8/6P1/7P/5b2/6q1 b - - 0 1",
    "sideToMove": "black",
    "boardOrientation": "black",
    "solution": {
      "firstUci": "f2e3",
      "firstSan": "Be3+",
      "branches": [
        {
          "replyUci": "g4g5",
          "replySan": "g5",
          "winningUcis": [
            "g1g5",
            "e3g5"
          ],
          "winningSans": [
            "Qxg5#",
            "Bxg5#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-061",
    "fen": "1r6/1pR2N2/p3k1b1/3pn3/7Q/P4pPp/1P3P2/2R3K1 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "c7e7",
      "firstSan": "Re7+",
      "branches": [
        {
          "replyUci": "e6f5",
          "replySan": "Kf5",
          "winningUcis": [
            "h4f4",
            "e7e5",
            "f7d6",
            "f7h6"
          ],
          "winningSans": [
            "Qf4#",
            "Rxe5#",
            "Nd6#",
            "Nh6#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-062",
    "fen": "8/3b4/7R/2p1k3/P1P1P3/4K3/P5N1/8 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "g2f4",
      "firstSan": "Nf4",
      "branches": [
        {
          "replyUci": "d7h3",
          "replySan": "Bh3",
          "winningUcis": [
            "f4d3"
          ],
          "winningSans": [
            "Nd3#"
          ]
        },
        {
          "replyUci": "d7a4",
          "replySan": "Bxa4",
          "winningUcis": [
            "f4d3",
            "h6e6"
          ],
          "winningSans": [
            "Nd3#",
            "Re6#"
          ]
        },
        {
          "replyUci": "d7g4",
          "replySan": "Bg4",
          "winningUcis": [
            "f4d3"
          ],
          "winningSans": [
            "Nd3#"
          ]
        },
        {
          "replyUci": "d7b5",
          "replySan": "Bb5",
          "winningUcis": [
            "f4d3",
            "h6e6"
          ],
          "winningSans": [
            "Nd3#",
            "Re6#"
          ]
        },
        {
          "replyUci": "d7f5",
          "replySan": "Bf5",
          "winningUcis": [
            "f4d3"
          ],
          "winningSans": [
            "Nd3#"
          ]
        },
        {
          "replyUci": "d7c6",
          "replySan": "Bc6",
          "winningUcis": [
            "f4d3",
            "h6e6"
          ],
          "winningSans": [
            "Nd3#",
            "Re6#"
          ]
        },
        {
          "replyUci": "d7e6",
          "replySan": "Be6",
          "winningUcis": [
            "h6e6"
          ],
          "winningSans": [
            "Rxe6#"
          ]
        },
        {
          "replyUci": "d7c8",
          "replySan": "Bc8",
          "winningUcis": [
            "f4d3"
          ],
          "winningSans": [
            "Nd3#"
          ]
        },
        {
          "replyUci": "d7e8",
          "replySan": "Be8",
          "winningUcis": [
            "f4d3",
            "h6e6"
          ],
          "winningSans": [
            "Nd3#",
            "Re6#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-063",
    "fen": "8/3q3k/3p4/2pB4/2Pp4/3P1Q1P/8/1rB4K w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "f3h5",
      "firstSan": "Qh5+",
      "branches": [
        {
          "replyUci": "h7g7",
          "replySan": "Kg7",
          "winningUcis": [
            "h5h6"
          ],
          "winningSans": [
            "Qh6#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-064",
    "fen": "8/q7/2pp4/1p4p1/1P3P2/4k3/8/3K4 b - - 0 1",
    "sideToMove": "black",
    "boardOrientation": "black",
    "solution": {
      "firstUci": "e3d3",
      "firstSan": "Kd3",
      "branches": [
        {
          "replyUci": "d1c1",
          "replySan": "Kc1",
          "winningUcis": [
            "a7a1"
          ],
          "winningSans": [
            "Qa1#"
          ]
        },
        {
          "replyUci": "d1e1",
          "replySan": "Ke1",
          "winningUcis": [
            "a7g1"
          ],
          "winningSans": [
            "Qg1#"
          ]
        },
        {
          "replyUci": "f4f5",
          "replySan": "f5",
          "winningUcis": [
            "a7a1",
            "a7g1"
          ],
          "winningSans": [
            "Qa1#",
            "Qg1#"
          ]
        },
        {
          "replyUci": "f4g5",
          "replySan": "fxg5",
          "winningUcis": [
            "a7a1",
            "a7g1"
          ],
          "winningSans": [
            "Qa1#",
            "Qg1#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-065",
    "fen": "8/P1r5/1p2q3/2k5/5K2/2P4r/R7/8 b - - 0 1",
    "sideToMove": "black",
    "boardOrientation": "black",
    "solution": {
      "firstUci": "c7f7",
      "firstSan": "Rf7+",
      "branches": [
        {
          "replyUci": "f4g5",
          "replySan": "Kg5",
          "winningUcis": [
            "e6f5"
          ],
          "winningSans": [
            "Qf5#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-066",
    "fen": "8/8/8/8/4r3/K1k5/1p6/8 b - - 0 1",
    "sideToMove": "black",
    "boardOrientation": "black",
    "solution": {
      "firstUci": "c3c2",
      "firstSan": "Kc2",
      "branches": [
        {
          "replyUci": "a3a2",
          "replySan": "Ka2",
          "winningUcis": [
            "e4a4"
          ],
          "winningSans": [
            "Ra4#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-067",
    "fen": "8/7p/8/8/4b2q/1Q6/2p5/3k2K1 b - - 0 1",
    "sideToMove": "black",
    "boardOrientation": "black",
    "solution": {
      "firstUci": "h4h1",
      "firstSan": "Qh1+",
      "branches": [
        {
          "replyUci": "g1f2",
          "replySan": "Kf2",
          "winningUcis": [
            "h1e1"
          ],
          "winningSans": [
            "Qe1#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-068",
    "fen": "4k1n1/8/P6p/1P4r1/7K/5P2/1q6/1R5R b - - 0 1",
    "sideToMove": "black",
    "boardOrientation": "black",
    "solution": {
      "firstUci": "b2f2",
      "firstSan": "Qf2+",
      "branches": [
        {
          "replyUci": "h4h3",
          "replySan": "Kh3",
          "winningUcis": [
            "f2g3"
          ],
          "winningSans": [
            "Qg3#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-069",
    "fen": "Q7/8/1k1K4/r7/8/8/R7/8 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "a8a5",
      "firstSan": "Qxa5+",
      "branches": [
        {
          "replyUci": "b6b7",
          "replySan": "Kb7",
          "winningUcis": [
            "a5c7"
          ],
          "winningSans": [
            "Qc7#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-070",
    "fen": "5BQ1/6p1/6kp/4Bp2/3P1P2/7P/5qPK/5r2 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "g8g7",
      "firstSan": "Qxg7+",
      "branches": [
        {
          "replyUci": "g6h5",
          "replySan": "Kh5",
          "winningUcis": [
            "g7h6"
          ],
          "winningSans": [
            "Qxh6#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-071",
    "fen": "6R1/3R1p2/p4N1k/1p4p1/6B1/P6P/1P4P1/7K w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "d7f7",
      "firstSan": "Rxf7",
      "branches": [
        {
          "replyUci": "b5b4",
          "replySan": "b4",
          "winningUcis": [
            "f7h7"
          ],
          "winningSans": [
            "Rh7#"
          ]
        },
        {
          "replyUci": "a6a5",
          "replySan": "a5",
          "winningUcis": [
            "f7h7"
          ],
          "winningSans": [
            "Rh7#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-072",
    "fen": "1kr2b2/p2Rp1p1/3pP3/Bq1Q1P2/2pP4/8/P5pP/6K1 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "d5b5",
      "firstSan": "Qxb5+",
      "branches": [
        {
          "replyUci": "b8a8",
          "replySan": "Ka8",
          "winningUcis": [
            "b5b7"
          ],
          "winningSans": [
            "Qb7#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-073",
    "fen": "8/8/8/5r2/8/5k2/6pK/8 b - - 0 1",
    "sideToMove": "black",
    "boardOrientation": "black",
    "solution": {
      "firstUci": "f5h5",
      "firstSan": "Rh5+",
      "branches": [
        {
          "replyUci": "h2g1",
          "replySan": "Kg1",
          "winningUcis": [
            "h5h1"
          ],
          "winningSans": [
            "Rh1#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-074",
    "fen": "8/6Q1/8/8/6p1/2K3P1/k7/8 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "g7b7",
      "firstSan": "Qb7",
      "branches": [
        {
          "replyUci": "a2a1",
          "replySan": "Ka1",
          "winningUcis": [
            "b7b2"
          ],
          "winningSans": [
            "Qb2#"
          ]
        },
        {
          "replyUci": "a2a3",
          "replySan": "Ka3",
          "winningUcis": [
            "b7b3",
            "b7a6",
            "b7a7",
            "b7a8"
          ],
          "winningSans": [
            "Qb3#",
            "Qa6#",
            "Qa7#",
            "Qa8#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-075",
    "fen": "5rk1/1pp2rp1/p2pQ2p/3N4/6q1/P3P1P1/1P5P/6K1 b - - 0 1",
    "sideToMove": "black",
    "boardOrientation": "black",
    "solution": {
      "firstUci": "g4d1",
      "firstSan": "Qd1+",
      "branches": [
        {
          "replyUci": "g1g2",
          "replySan": "Kg2",
          "winningUcis": [
            "d1f1"
          ],
          "winningSans": [
            "Qf1#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-076",
    "fen": "2R5/k1K5/8/1Pp5/2P5/3P4/8/8 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "b5b6",
      "firstSan": "b6+",
      "branches": [
        {
          "replyUci": "a7a6",
          "replySan": "Ka6",
          "winningUcis": [
            "c8a8"
          ],
          "winningSans": [
            "Ra8#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-077",
    "fen": "8/8/3Q4/8/8/2K5/1p6/2k5 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "d6d2",
      "firstSan": "Qd2+",
      "branches": [
        {
          "replyUci": "c1b1",
          "replySan": "Kb1",
          "winningUcis": [
            "d2b2"
          ],
          "winningSans": [
            "Qxb2#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-078",
    "fen": "r6k/8/b2p3p/Q1pP1p2/8/p5R1/p5PP/6K1 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "a5c3",
      "firstSan": "Qc3+",
      "branches": [
        {
          "replyUci": "h8h7",
          "replySan": "Kh7",
          "winningUcis": [
            "c3g7"
          ],
          "winningSans": [
            "Qg7#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-079",
    "fen": "bkN5/2R3R1/4p3/P5p1/4p2p/4P3/4KP2/8 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "c8b6",
      "firstSan": "Nb6",
      "branches": [
        {
          "replyUci": "h4h3",
          "replySan": "h3",
          "winningUcis": [
            "c7c8"
          ],
          "winningSans": [
            "Rc8#"
          ]
        },
        {
          "replyUci": "g5g4",
          "replySan": "g4",
          "winningUcis": [
            "c7c8"
          ],
          "winningSans": [
            "Rc8#"
          ]
        },
        {
          "replyUci": "e6e5",
          "replySan": "e5",
          "winningUcis": [
            "c7c8"
          ],
          "winningSans": [
            "Rc8#"
          ]
        },
        {
          "replyUci": "a8d5",
          "replySan": "Bd5",
          "winningUcis": [
            "c7c8"
          ],
          "winningSans": [
            "Rc8#"
          ]
        },
        {
          "replyUci": "a8c6",
          "replySan": "Bc6",
          "winningUcis": [
            "c7c8"
          ],
          "winningSans": [
            "Rc8#"
          ]
        },
        {
          "replyUci": "a8b7",
          "replySan": "Bb7",
          "winningUcis": [
            "c7b7"
          ],
          "winningSans": [
            "Rxb7#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-080",
    "fen": "k7/p2Q3p/1p6/8/4b3/2P4P/nP1K4/5q2 b - - 0 1",
    "sideToMove": "black",
    "boardOrientation": "black",
    "solution": {
      "firstUci": "f1f2",
      "firstSan": "Qf2+",
      "branches": [
        {
          "replyUci": "d2d1",
          "replySan": "Kd1",
          "winningUcis": [
            "e4c2",
            "e4f3"
          ],
          "winningSans": [
            "Bc2#",
            "Bf3#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-081",
    "fen": "2k5/7p/PPB2p2/8/8/6P1/5K1P/1R6 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "b1e1",
      "firstSan": "Re1",
      "branches": [
        {
          "replyUci": "f6f5",
          "replySan": "f5",
          "winningUcis": [
            "e1e8"
          ],
          "winningSans": [
            "Re8#"
          ]
        },
        {
          "replyUci": "h7h5",
          "replySan": "h5",
          "winningUcis": [
            "e1e8"
          ],
          "winningSans": [
            "Re8#"
          ]
        },
        {
          "replyUci": "h7h6",
          "replySan": "h6",
          "winningUcis": [
            "e1e8"
          ],
          "winningSans": [
            "Re8#"
          ]
        },
        {
          "replyUci": "c8b8",
          "replySan": "Kb8",
          "winningUcis": [
            "e1e8"
          ],
          "winningSans": [
            "Re8#"
          ]
        },
        {
          "replyUci": "c8d8",
          "replySan": "Kd8",
          "winningUcis": [
            "e1e8"
          ],
          "winningSans": [
            "Re8#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-082",
    "fen": "5rk1/6np/pp1p4/3P4/PQ1NPn2/1q3P1b/1P2B2P/2R4K b - - 0 1",
    "sideToMove": "black",
    "boardOrientation": "black",
    "solution": {
      "firstUci": "h3g2",
      "firstSan": "Bg2+",
      "branches": [
        {
          "replyUci": "h1g1",
          "replySan": "Kg1",
          "winningUcis": [
            "b3e3"
          ],
          "winningSans": [
            "Qe3#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-083",
    "fen": "8/2P5/k2K3Q/8/p2B4/P7/6p1/8 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "c7c8q",
      "firstSan": "c8=Q+",
      "branches": [
        {
          "replyUci": "a6a5",
          "replySan": "Ka5",
          "winningUcis": [
            "h6g5",
            "h6h5"
          ],
          "winningSans": [
            "Qg5#",
            "Qh5#"
          ]
        },
        {
          "replyUci": "a6b5",
          "replySan": "Kb5",
          "winningUcis": [
            "h6g5",
            "h6h5"
          ],
          "winningSans": [
            "Qg5#",
            "Qh5#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-084",
    "fen": "4k3/8/1P3Q2/8/8/2P1BP1p/1K5P/7R w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "f6e6",
      "firstSan": "Qe6+",
      "branches": [
        {
          "replyUci": "e8d8",
          "replySan": "Kd8",
          "winningUcis": [
            "h1d1",
            "e3g5"
          ],
          "winningSans": [
            "Rd1#",
            "Bg5#"
          ]
        },
        {
          "replyUci": "e8f8",
          "replySan": "Kf8",
          "winningUcis": [
            "e3h6"
          ],
          "winningSans": [
            "Bh6#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-085",
    "fen": "2kr2r1/1pp2p2/3p4/4pb2/3q3P/5P1N/1B5P/3B3K b - - 0 1",
    "sideToMove": "black",
    "boardOrientation": "black",
    "solution": {
      "firstUci": "d4d1",
      "firstSan": "Qxd1+",
      "branches": [
        {
          "replyUci": "h3g1",
          "replySan": "Ng1",
          "winningUcis": [
            "d1g1",
            "g8g1"
          ],
          "winningSans": [
            "Qxg1#",
            "Rxg1#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-086",
    "fen": "5k2/8/4Q3/7p/2PN4/2B5/5KP1/8 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "d4f5",
      "firstSan": "Nf5",
      "branches": [
        {
          "replyUci": "h5h4",
          "replySan": "h4",
          "winningUcis": [
            "c3b4",
            "c3g7"
          ],
          "winningSans": [
            "Bb4#",
            "Bg7#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-087",
    "fen": "5k2/p3R2p/B5p1/5bQ1/N4Pp1/1P2P3/5K1P/R7 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "g5f6",
      "firstSan": "Qf6+",
      "branches": [
        {
          "replyUci": "f8g8",
          "replySan": "Kg8",
          "winningUcis": [
            "f6g7",
            "e7e8"
          ],
          "winningSans": [
            "Qg7#",
            "Re8#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-088",
    "fen": "3k3r/R7/2b1Q1nB/1p1pP2r/2pP2p1/6P1/2P2P2/6K1 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "e6d6",
      "firstSan": "Qd6+",
      "branches": [
        {
          "replyUci": "c6d7",
          "replySan": "Bd7",
          "winningUcis": [
            "d6d7",
            "a7a8"
          ],
          "winningSans": [
            "Qxd7#",
            "Ra8#"
          ]
        },
        {
          "replyUci": "d8c8",
          "replySan": "Kc8",
          "winningUcis": [
            "d6c7"
          ],
          "winningSans": [
            "Qc7#"
          ]
        },
        {
          "replyUci": "d8e8",
          "replySan": "Ke8",
          "winningUcis": [
            "d6b8"
          ],
          "winningSans": [
            "Qb8#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-089",
    "fen": "2b5/8/2p5/1pP5/p3k2K/8/2q5/8 b - - 0 1",
    "sideToMove": "black",
    "boardOrientation": "black",
    "solution": {
      "firstUci": "e4f4",
      "firstSan": "Kf4",
      "branches": [
        {
          "replyUci": "h4h5",
          "replySan": "Kh5",
          "winningUcis": [
            "c2h7"
          ],
          "winningSans": [
            "Qh7#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-090",
    "fen": "6k1/R1q3pp/1p3nn1/1P6/P4p2/5K2/8/3r4 b - - 0 1",
    "sideToMove": "black",
    "boardOrientation": "black",
    "solution": {
      "firstUci": "g6h4",
      "firstSan": "Nh4+",
      "branches": [
        {
          "replyUci": "f3e2",
          "replySan": "Ke2",
          "winningUcis": [
            "c7c2"
          ],
          "winningSans": [
            "Qc2#"
          ]
        },
        {
          "replyUci": "f3f2",
          "replySan": "Kf2",
          "winningUcis": [
            "c7c2"
          ],
          "winningSans": [
            "Qc2#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-091",
    "fen": "r6r/1R4Qp/p1Pp1p2/7k/1P1q4/6P1/5PKP/5B2 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "f1e2",
      "firstSan": "Be2+",
      "branches": [
        {
          "replyUci": "d4g4",
          "replySan": "Qg4",
          "winningUcis": [
            "e2g4"
          ],
          "winningSans": [
            "Bxg4#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-092",
    "fen": "6R1/1r2k3/6BR/4N1p1/5pP1/pn3P2/6K1/8 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "g6f7",
      "firstSan": "Bf7",
      "branches": [
        {
          "replyUci": "a3a2",
          "replySan": "a2",
          "winningUcis": [
            "h6e6",
            "g8e8"
          ],
          "winningSans": [
            "Re6#",
            "Re8#"
          ]
        },
        {
          "replyUci": "b3a1",
          "replySan": "Na1",
          "winningUcis": [
            "h6e6",
            "g8e8"
          ],
          "winningSans": [
            "Re6#",
            "Re8#"
          ]
        },
        {
          "replyUci": "b3c1",
          "replySan": "Nc1",
          "winningUcis": [
            "h6e6",
            "g8e8"
          ],
          "winningSans": [
            "Re6#",
            "Re8#"
          ]
        },
        {
          "replyUci": "b3d2",
          "replySan": "Nd2",
          "winningUcis": [
            "h6e6",
            "g8e8"
          ],
          "winningSans": [
            "Re6#",
            "Re8#"
          ]
        },
        {
          "replyUci": "b3d4",
          "replySan": "Nd4",
          "winningUcis": [
            "g8e8"
          ],
          "winningSans": [
            "Re8#"
          ]
        },
        {
          "replyUci": "b3a5",
          "replySan": "Na5",
          "winningUcis": [
            "h6e6",
            "g8e8"
          ],
          "winningSans": [
            "Re6#",
            "Re8#"
          ]
        },
        {
          "replyUci": "b3c5",
          "replySan": "Nc5",
          "winningUcis": [
            "g8e8"
          ],
          "winningSans": [
            "Re8#"
          ]
        },
        {
          "replyUci": "b7b4",
          "replySan": "Rb4",
          "winningUcis": [
            "h6e6",
            "g8e8"
          ],
          "winningSans": [
            "Re6#",
            "Re8#"
          ]
        },
        {
          "replyUci": "b7b5",
          "replySan": "Rb5",
          "winningUcis": [
            "h6e6",
            "g8e8"
          ],
          "winningSans": [
            "Re6#",
            "Re8#"
          ]
        },
        {
          "replyUci": "b7b6",
          "replySan": "Rb6",
          "winningUcis": [
            "g8e8"
          ],
          "winningSans": [
            "Re8#"
          ]
        },
        {
          "replyUci": "b7a7",
          "replySan": "Ra7",
          "winningUcis": [
            "h6e6",
            "g8e8"
          ],
          "winningSans": [
            "Re6#",
            "Re8#"
          ]
        },
        {
          "replyUci": "b7c7",
          "replySan": "Rc7",
          "winningUcis": [
            "h6e6",
            "g8e8"
          ],
          "winningSans": [
            "Re6#",
            "Re8#"
          ]
        },
        {
          "replyUci": "b7d7",
          "replySan": "Rd7",
          "winningUcis": [
            "h6e6",
            "g8e8"
          ],
          "winningSans": [
            "Re6#",
            "Re8#"
          ]
        },
        {
          "replyUci": "b7b8",
          "replySan": "Rb8",
          "winningUcis": [
            "h6e6"
          ],
          "winningSans": [
            "Re6#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-093",
    "fen": "4k3/1q1n4/4pp1p/2p5/P2PP3/8/1B4rP/R1K1R3 b - - 0 1",
    "sideToMove": "black",
    "boardOrientation": "black",
    "solution": {
      "firstUci": "b7b2",
      "firstSan": "Qxb2+",
      "branches": [
        {
          "replyUci": "c1d1",
          "replySan": "Kd1",
          "winningUcis": [
            "b2a1",
            "b2c2",
            "b2d2",
            "g2d2"
          ],
          "winningSans": [
            "Qxa1#",
            "Qc2#",
            "Qd2#",
            "Rd2#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-094",
    "fen": "8/P6p/R5r1/8/4Q3/8/5kPK/8 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "a6a2",
      "firstSan": "Ra2+",
      "branches": [
        {
          "replyUci": "f2f1",
          "replySan": "Kf1",
          "winningUcis": [
            "e4b1",
            "e4e2"
          ],
          "winningSans": [
            "Qb1#",
            "Qe2#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-095",
    "fen": "4k3/pp6/3QP3/2p2P2/1PP2Pn1/P1K5/7r/5q2 b - - 0 1",
    "sideToMove": "black",
    "boardOrientation": "black",
    "solution": {
      "firstUci": "f1c1",
      "firstSan": "Qc1+",
      "branches": [
        {
          "replyUci": "c3b3",
          "replySan": "Kb3",
          "winningUcis": [
            "c1c2"
          ],
          "winningSans": [
            "Qc2#"
          ]
        },
        {
          "replyUci": "c3d3",
          "replySan": "Kd3",
          "winningUcis": [
            "c1c2",
            "c1e3"
          ],
          "winningSans": [
            "Qc2#",
            "Qe3#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-096",
    "fen": "8/2N2R2/3p4/2k5/4QP2/2P5/3K1b2/8 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "e4b4",
      "firstSan": "Qb4+",
      "branches": [
        {
          "replyUci": "c5c6",
          "replySan": "Kc6",
          "winningUcis": [
            "b4b5"
          ],
          "winningSans": [
            "Qb5#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-097",
    "fen": "5Q2/p2R4/1bp5/3pk3/1P1p4/2P1P3/P6P/RN4K1 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "d7e7",
      "firstSan": "Re7+",
      "branches": [
        {
          "replyUci": "e5d6",
          "replySan": "Kd6",
          "winningUcis": [
            "f8f6"
          ],
          "winningSans": [
            "Qf6#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-098",
    "fen": "4q1k1/p2r3p/3P2p1/1pp1B1Q1/4p3/1P4P1/P6P/5RK1 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "g5f6",
      "firstSan": "Qf6",
      "branches": [
        {
          "replyUci": "e4e3",
          "replySan": "e3",
          "winningUcis": [
            "f6h8"
          ],
          "winningSans": [
            "Qh8#"
          ]
        },
        {
          "replyUci": "b5b4",
          "replySan": "b4",
          "winningUcis": [
            "f6h8"
          ],
          "winningSans": [
            "Qh8#"
          ]
        },
        {
          "replyUci": "c5c4",
          "replySan": "c4",
          "winningUcis": [
            "f6h8"
          ],
          "winningSans": [
            "Qh8#"
          ]
        },
        {
          "replyUci": "g6g5",
          "replySan": "g5",
          "winningUcis": [
            "f6h8"
          ],
          "winningSans": [
            "Qh8#"
          ]
        },
        {
          "replyUci": "a7a5",
          "replySan": "a5",
          "winningUcis": [
            "f6h8"
          ],
          "winningSans": [
            "Qh8#"
          ]
        },
        {
          "replyUci": "a7a6",
          "replySan": "a6",
          "winningUcis": [
            "f6h8"
          ],
          "winningSans": [
            "Qh8#"
          ]
        },
        {
          "replyUci": "d7d6",
          "replySan": "Rxd6",
          "winningUcis": [
            "f6g7",
            "f6h8"
          ],
          "winningSans": [
            "Qg7#",
            "Qh8#"
          ]
        },
        {
          "replyUci": "d7b7",
          "replySan": "Rb7",
          "winningUcis": [
            "f6h8"
          ],
          "winningSans": [
            "Qh8#"
          ]
        },
        {
          "replyUci": "d7c7",
          "replySan": "Rc7",
          "winningUcis": [
            "f6h8"
          ],
          "winningSans": [
            "Qh8#"
          ]
        },
        {
          "replyUci": "d7e7",
          "replySan": "Re7",
          "winningUcis": [
            "f6h8"
          ],
          "winningSans": [
            "Qh8#"
          ]
        },
        {
          "replyUci": "d7f7",
          "replySan": "Rf7",
          "winningUcis": [
            "f6h8"
          ],
          "winningSans": [
            "Qh8#"
          ]
        },
        {
          "replyUci": "d7g7",
          "replySan": "Rg7",
          "winningUcis": [
            "f6g7"
          ],
          "winningSans": [
            "Qxg7#"
          ]
        },
        {
          "replyUci": "d7d8",
          "replySan": "Rd8",
          "winningUcis": [
            "f6g7",
            "f6h8"
          ],
          "winningSans": [
            "Qg7#",
            "Qh8#"
          ]
        },
        {
          "replyUci": "h7h5",
          "replySan": "h5",
          "winningUcis": [
            "f6h8"
          ],
          "winningSans": [
            "Qh8#"
          ]
        },
        {
          "replyUci": "h7h6",
          "replySan": "h6",
          "winningUcis": [
            "f6h8"
          ],
          "winningSans": [
            "Qh8#"
          ]
        },
        {
          "replyUci": "e8e5",
          "replySan": "Qxe5",
          "winningUcis": [
            "f6f8"
          ],
          "winningSans": [
            "Qf8#"
          ]
        },
        {
          "replyUci": "e8e6",
          "replySan": "Qe6",
          "winningUcis": [
            "f6f8",
            "f6h8"
          ],
          "winningSans": [
            "Qf8#",
            "Qh8#"
          ]
        },
        {
          "replyUci": "e8e7",
          "replySan": "Qe7",
          "winningUcis": [
            "f6h8"
          ],
          "winningSans": [
            "Qh8#"
          ]
        },
        {
          "replyUci": "e8f7",
          "replySan": "Qf7",
          "winningUcis": [
            "f6h8"
          ],
          "winningSans": [
            "Qh8#"
          ]
        },
        {
          "replyUci": "e8a8",
          "replySan": "Qa8",
          "winningUcis": [
            "f6h8"
          ],
          "winningSans": [
            "Qh8#"
          ]
        },
        {
          "replyUci": "e8b8",
          "replySan": "Qb8",
          "winningUcis": [
            "f6h8"
          ],
          "winningSans": [
            "Qh8#"
          ]
        },
        {
          "replyUci": "e8c8",
          "replySan": "Qc8",
          "winningUcis": [
            "f6h8"
          ],
          "winningSans": [
            "Qh8#"
          ]
        },
        {
          "replyUci": "e8d8",
          "replySan": "Qd8",
          "winningUcis": [
            "f6h8"
          ],
          "winningSans": [
            "Qh8#"
          ]
        },
        {
          "replyUci": "e8f8",
          "replySan": "Qf8",
          "winningUcis": [
            "f6f8",
            "f6h8"
          ],
          "winningSans": [
            "Qxf8#",
            "Qh8#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-099",
    "fen": "8/8/7R/2p1k2N/p1P1P1b1/1P2K3/P7/8 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "h5f4",
      "firstSan": "Nf4",
      "branches": [
        {
          "replyUci": "a4a3",
          "replySan": "a3",
          "winningUcis": [
            "f4d3"
          ],
          "winningSans": [
            "Nd3#"
          ]
        },
        {
          "replyUci": "a4b3",
          "replySan": "axb3",
          "winningUcis": [
            "f4d3"
          ],
          "winningSans": [
            "Nd3#"
          ]
        },
        {
          "replyUci": "g4d1",
          "replySan": "Bd1",
          "winningUcis": [
            "f4d3",
            "h6e6"
          ],
          "winningSans": [
            "Nd3#",
            "Re6#"
          ]
        },
        {
          "replyUci": "g4e2",
          "replySan": "Be2",
          "winningUcis": [
            "h6e6"
          ],
          "winningSans": [
            "Re6#"
          ]
        },
        {
          "replyUci": "g4f3",
          "replySan": "Bf3",
          "winningUcis": [
            "f4d3",
            "h6e6"
          ],
          "winningSans": [
            "Nd3#",
            "Re6#"
          ]
        },
        {
          "replyUci": "g4h3",
          "replySan": "Bh3",
          "winningUcis": [
            "f4d3"
          ],
          "winningSans": [
            "Nd3#"
          ]
        },
        {
          "replyUci": "g4f5",
          "replySan": "Bf5",
          "winningUcis": [
            "f4d3"
          ],
          "winningSans": [
            "Nd3#"
          ]
        },
        {
          "replyUci": "g4h5",
          "replySan": "Bh5",
          "winningUcis": [
            "f4d3",
            "h6e6"
          ],
          "winningSans": [
            "Nd3#",
            "Re6#"
          ]
        },
        {
          "replyUci": "g4e6",
          "replySan": "Be6",
          "winningUcis": [
            "h6e6"
          ],
          "winningSans": [
            "Rxe6#"
          ]
        },
        {
          "replyUci": "g4d7",
          "replySan": "Bd7",
          "winningUcis": [
            "f4d3"
          ],
          "winningSans": [
            "Nd3#"
          ]
        },
        {
          "replyUci": "g4c8",
          "replySan": "Bc8",
          "winningUcis": [
            "f4d3"
          ],
          "winningSans": [
            "Nd3#"
          ]
        }
      ]
    }
  },
  {
    "id": "M2-100",
    "fen": "8/1pr3kp/p3p3/3nN1q1/8/P7/1P4Q1/1K3R2 w - - 0 1",
    "sideToMove": "white",
    "boardOrientation": "white",
    "solution": {
      "firstUci": "g2g5",
      "firstSan": "Qxg5+",
      "branches": [
        {
          "replyUci": "g7h8",
          "replySan": "Kh8",
          "winningUcis": [
            "f1f8"
          ],
          "winningSans": [
            "Rf8#"
          ]
        }
      ]
    }
  }
];
