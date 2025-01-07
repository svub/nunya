// WARNING: The below was generated with AI using claude.ai after asking it:
// given the following function code between the inverted commas <omitted `prepareResultBytesToCallbackData` function>
// if the output of that function is `result` bytes and it was sent to a different function
// `function fulfilledValueCallback(uint256 _requestId, bytes calldata data) external onlyGateway`,
// where its bytes value was in base64 format, which is
// `{"_request_id":{"network":"31337","task_id":"10"},"_key":[78,85,78,89,65],"_code":0,"_nunya_business_contract_address":"0xAFFF311821C3F3AF863C7103BB17BDC1Ba04603D"}`
// when converted to text, then how could i extract the JSON in Solidity and extract only the value of its property
// `"_key"` without the transaction running out of gas?

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract JSONParser {
    // Custom error for invalid data format
    error InvalidDataFormat();
    
    function extractKeyArray(bytes calldata data) public pure returns (uint256) {
        // Skip the callback selector (4 bytes) and taskId (32 bytes)
        // The actual JSON data starts after the ABI encoding overhead
        
        // Find the position of "_key":[
        bytes memory searchKey = '"_key":[';
        uint256 startPos;
        bool found = false;
        
        // Search for the key in chunks to save gas
        for (uint i = 0; i < data.length - searchKey.length; i += 32) {
            // Load 32 bytes at a time
            bytes32 chunk;
            assembly {
                chunk := calldataload(add(data.offset, i))
            }
            
            // Check if our search key starts in this chunk
            bool matchFound = true;
            for (uint j = 0; j < searchKey.length && i + j < data.length; j++) {
                if (uint8(chunk[j]) != uint8(searchKey[j])) {
                    matchFound = false;
                    break;
                }
            }
            
            if (matchFound) {
                startPos = i + searchKey.length;
                found = true;
                break;
            }
        }
        
        if (!found) revert InvalidDataFormat();
        
        // Extract the array values
        uint256 result;
        uint256 currentNumber = 0;
        uint256 arrayIndex = 0;
        
        // Process only until we hit the closing bracket or exceed 5 numbers
        for (uint i = startPos; i < data.length && arrayIndex < 5; i++) {
            uint8 char = uint8(data[i]);
            
            if (char >= 48 && char <= 57) { // If character is a digit
                currentNumber = currentNumber * 10 + (char - 48);
            } else if (char == 44 || char == 93) { // If comma or closing bracket
                // Pack the number into the result
                result = (result << 8) | uint8(currentNumber);
                currentNumber = 0;
                arrayIndex++;
                
                if (char == 93) break; // Exit if closing bracket
            }
        }
        
        return result;
    }
    
    function unpackArray(uint256 packed) public pure returns (uint8[5] memory) {
        uint8[5] memory result;
        for (uint i = 0; i < 5; i++) {
            result[4-i] = uint8((packed >> (i * 8)) & 0xFF);
        }
        return result;
    }
}