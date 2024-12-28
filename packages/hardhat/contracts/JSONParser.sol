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
    // Custom error to save gas
    error InvalidJSONFormat();
    
    function extractKeyArray(bytes calldata data) public pure returns (uint8[] memory) {
        // Skip the base64 decoding as the data is already decoded in this case
        
        // Find the "_key" property - we know it comes after "_request_id"
        // Search for "[" after "_key":" pattern
        uint256 startPos;
        uint256 endPos;
        
        for (uint i = 0; i < data.length - 6; i++) {
            // Look for "_key":" pattern
            if (data[i] == '_' && 
                data[i+1] == 'k' && 
                data[i+2] == 'e' && 
                data[i+3] == 'y' &&
                data[i+4] == '"' &&
                data[i+5] == ':') {
                    
                // Find the opening bracket
                while (i < data.length && data[i] != '[') {
                    i++;
                }
                startPos = i + 1;
                
                // Find the closing bracket
                while (i < data.length && data[i] != ']') {
                    i++;
                }
                endPos = i;
                break;
            }
        }
        
        if (startPos == 0 || endPos == 0) revert InvalidJSONFormat();
        
        // Count the numbers (commas + 1)
        uint256 count = 1;
        for (uint256 i = startPos; i < endPos; i++) {
            if (data[i] == ',') count++;
        }
        
        // Create array to store results
        uint8[] memory result = new uint8[](count);
        uint256 resultIndex = 0;
        uint256 currentNum = 0;
        
        // Parse numbers
        for (uint256 i = startPos; i < endPos; i++) {
            bytes1 char = data[i];
            
            if (char >= '0' && char <= '9') {
                currentNum = currentNum * 10 + uint8(uint8(char) - 48);
            }
            
            if (char == ',' || i == endPos - 1) {
                result[resultIndex] = uint8(currentNum);
                currentNum = 0;
                resultIndex++;
            }
        }
        
        return result;
    }
}
