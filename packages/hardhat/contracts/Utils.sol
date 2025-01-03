// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

contract Utils {
    // @notice Compare two strings using their hashed values
    // https://kenwagatsuma.com/en/blog/compare-strings-in-solidity/
    function compStr(string memory x, string memory y) public pure returns (bool) {
        if (bytes(x).length != bytes(y).length) {
            return false;
        } else {
            return (keccak256(abi.encodePacked(x)) ==
                keccak256(abi.encodePacked(y)));
        }
    }

    function bytes32ToBytes(bytes32 data) public pure returns (bytes memory) {
        return bytes.concat(data);
    }

    // // @notice Re-derive address from pubkey
    // // https://ethereum.stackexchange.com/a/15190/9680
    // function checkPubKey(bytes calldata _pubkey, address _address) public returns (bool) {
    //     return (uint(keccak256(_pubkey)) & 0x00FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF) == uint(_address);
    // }

    /// @notice Converts a uint256 value into its string representation
    /// @param x The uint256 value to convert
    /// @return s The bytes string representation of the uint256 value

    function uint256toBytesString(uint256 x) public pure returns (bytes memory s) {
        unchecked {
            if (x < 1e31) { 
                uint256 c1 = itoa31(x);
                assembly {
                    s := mload(0x40) // Set s to point to the free memory pointer
                    let z := shr(248, c1) // Extract the digit count for c1
                    mstore(s, z) // Allocate 32 bytes for the string length
                    mstore(add(s, 32), shl(sub(256, mul(z, 8)), c1)) // Store c2 adjusted by z digits
                    mstore(0x40, add(s, 64)) // Update the free memory pointer
                }
            }   
            else if (x < 1e62) {
                uint256 c1 = itoa31(x);
                uint256 c2 = itoa31(x/1e31);
                assembly {
                    s := mload(0x40) // Set s to the free memory pointer
                    let z := shr(248, c2) // Extract the digit count for c2
                    mstore(s, add(z, 31)) // Allocate space for z digits of c2 + 31 bytes of c1
                    mstore(add(s, 32), shl(sub(256, mul(z, 8)), c2)) // Store c2 adjusted by z digits
                    mstore(add(s, add(32, z)), shl(8,c1)) // Store the last 31 bytes of c1
                    mstore(0x40, add(s, 96)) // Update the free memory pointer
                }
            } else {
                uint256 c1 = itoa31(x);
                uint256 c2 = itoa31(x/1e31);
                uint256 c3 = itoa31(x/1e62);
                assembly {
                    s := mload(0x40) // Set s to point to the free memory pointer
                    let z := shr(248, c3) // Extract the digit count for c3
                    mstore(s, add(z, 62)) // Allocate 32 bytes for the string length
                    mstore(add(s, 32), shl(sub(256, mul(z, 8)), c3)) // Store c3 adjusted by z digits
                    mstore(add(s, add(32, z)), shl(8, c2)) // Store the last 31 bytes of c2 starting at z bytes
                    mstore(add(s, add(63, z)), shl(8, c1)) // Store the last 31 bytes of c3 starting at z + 31 bytes
                    mstore(0x40, add(s, 128)) // Update the free memory pointer to point beyond the allocated space
                }
            }
        }
    }
    /// @notice Helper function for UInt256 Conversion
    /// @param x The uint256 value to convert
    /// @return y The string representation of the uint256 value as a

    function itoa31 (uint256 x) public pure returns (uint256 y) {
        unchecked {
            //Core principle: last byte contains the mantissa of the number
            //first 31 bytes contain the converted number. 
            //Start with 0x30 byte offset, then add the number on it. 
            //0x30 + the number = the byte in hex that represents that number
            y = 0x0030303030303030303030303030303030303030303030303030303030303030
                // Convert the number into ASCII digits and place them in the correct position
                + (x % 10)
                + ((x / 1e1 % 10) << 8);

            // Use checkpoints to reduce unnecessary divisions and modulo operations
            if (x < 1e3) {
                if (x >= 1e2) return y += ((x * 0x290) & (0xf << 16)) | (3 << 248); // Three digits
                if (x >= 1e1) return y += 2 << 248; // Two digits
                return y += 1 << 248; // One digit
            }

            y +=  ((x / 1e2 % 10) << 16)
                + ((x / 1e3 % 10) << 24)
                + ((x / 1e4 % 10) << 32);

            if (x < 1e6) {
                if (x >= 1e5) return y += ((x * 0xa7c5ad) & (0xf << 40)) | (6 << 248); // Six digits
                if (x >= 1e4) return y += 5 << 248; // Five digits
                return y += 4 << 248; // Four digits
            }

            y +=  ((x / 1e5 % 10) << 40)
                + ((x / 1e6 % 10) << 48)
                + ((x / 1e7 % 10) << 56);

            if (x < 1e9) {
                if (x >= 1e8) return y += ((x * 0x2af31dc462) & (0xf << 64)) | (9 << 248); // Nine digits
                if (x >= 1e7) return y += 8 << 248; // Eight digits
                return y += 7 << 248; // Seven digits
            }

            y +=  ((x / 1e8 % 10) << 64)
                + ((x / 1e9 % 10) << 72)
                + ((x / 1e10 % 10) << 80);

            if (x < 1e12) {
                if (x >= 1e11) return y += ((x * 0xafebff0bcb24b) & (0xf << 88)) | (12 << 248); // Twelve digits
                if (x >= 1e10) return y += 11 << 248; // Eleven digits
                return y += 10 << 248; // Ten digits
            }

            y +=  ((x / 1e11 % 10) << 88)
                + ((x / 1e12 % 10) << 96)
                + ((x / 1e13 % 10) << 104);

            if (x < 1e15) {
                if (x >= 1e14) return y += ((x * 0x2d09370d42573603e) & (0xf << 112)) | (15 << 248); // Fifteen digits
                if (x >= 1e13) return y += 14 << 248; // Fourteen digits
                return y += 13 << 248; // Thirteen digits
            }

            y +=  ((x / 1e14 % 10) << 112)
                + ((x / 1e15 % 10) << 120)
                + ((x / 1e16 % 10) << 128);

            if (x < 1e18) {
                if (x >= 1e17) return y += ((x * 0xb877aa3236a4b44909bf) & (0xf << 136)) | (18 << 248); // Eighteen digits
                if (x >= 1e16) return y += 17 << 248; // Seventeen digits
                return y += 16 << 248; // Sixteen digits
            }

            y +=  ((x / 1e17 % 10) << 136)
                + ((x / 1e18 % 10) << 144)
                + ((x / 1e19 % 10) << 152);

            if (x < 1e21) {
                if (x >= 1e20) return y += ((x * 0x2f394219248446baa23d2ec8) & (0xf << 160)) | (21 << 248); // Twenty-one digits
                if (x >= 1e19) return y += 20 << 248; // Twenty digits
                return y += 19 << 248; // Nineteen digits
            }

            y +=  ((x / 1e20 % 10) << 160)
                + ((x / 1e21 % 10) << 168)
                + ((x / 1e22 % 10) << 176);

            if (x < 1e24) {
                if (x >= 1e23) return y += ((x * 0xc16d9a0095928a2775b7053c0f2) & (0xf << 184)) | (24 << 248); // Twenty-four digits
                if (x >= 1e22) return y += 23 << 248; // Twenty-three digits
                return y += 22 << 248; // Twenty-two digits
            }

            y +=  ((x / 1e23 % 10) << 184)
                + ((x / 1e24 % 10) << 192)
                + ((x / 1e25 % 10) << 200);

            if (x < 1e27) {
                if (x >= 1e26) return y += ((x * 0x318481895d962776a54d92bf80caa07) & (0xf << 208)) | (27 << 248); // Twenty-seven digits
                if (x >= 1e25) return y += 26 << 248; // Twenty-six digits
                return y += 25 << 248; // Twenty-five digits
            }

            y +=  ((x / 1e26 % 10) << 208)
                + ((x / 1e27 % 10) << 216)
                + ((x / 1e28 % 10) << 224);

            if (x < 1e30) {
                if (x >= 1e29) return y += ((x * 0xcad2f7f5359a3b3e096ee45813a0433060) & (0xf << 232)) | (30 << 248); // Thirty digits
                if (x >= 1e28) return y += 29 << 248; // Twenty-nine digits
                else return y += 28 << 248; // Twenty-eight digits
            }

            y +=  ((x / 1e29 % 10) << 232)
                + ((x / 1e30 % 10) << 240); 

            return y += 31 << 248; // Thirty-one digits
        }
    }
}
