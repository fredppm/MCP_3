"""
MCP Integration Tools for PraisonAI
Provides tools to interact with MCP v1.0 and v1.1 servers
"""

import json
import aiohttp
import asyncio
from typing import Dict, Any, Optional
import requests
from praisonaiagents import tool

# MCP Server Configuration
MCP_V1_URL = "http://localhost:4002/mcp" 
MCP_V11_URL = "http://localhost:4003/mcp"

class MCPClient:
    """Client for interacting with MCP servers via HTTP"""
    
    def __init__(self, base_url: str, version: str):
        self.base_url = base_url
        self.version = version
        
    async def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Call a tool on the MCP server"""
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": arguments
            }
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/call",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        return result
                    else:
                        return {
                            "error": f"HTTP {response.status}: {await response.text()}"
                        }
        except Exception as e:
            return {
                "error": f"Connection failed to MCP {self.version}: {str(e)}"
            }
    
    def call_tool_sync(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Synchronous version for compatibility"""
        payload = {
            "jsonrpc": "2.0", 
            "id": 1,
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": arguments
            }
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/call",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return {
                    "error": f"HTTP {response.status_code}: {response.text}"
                }
        except Exception as e:
            return {
                "error": f"Connection failed to MCP {self.version}: {str(e)}"
            }

# Initialize MCP clients
mcp_v1_client = MCPClient(MCP_V1_URL, "1.0")
mcp_v11_client = MCPClient(MCP_V11_URL, "1.1")

@tool
def sum_two_numbers(a: float, b: float) -> str:
    """
    Sum two numbers using MCP v1.0 server
    
    Args:
        a: First number to sum
        b: Second number to sum
        
    Returns:
        JSON string with the calculation result
    """
    try:
        result = mcp_v1_client.call_tool_sync("sum", {"a": a, "b": b})
        
        if "error" in result:
            return f"❌ MCP v1.0 Error: {result['error']}"
        
        # Parse the MCP response
        if result.get("result") and result["result"].get("content"):
            content = result["result"]["content"][0]["text"]
            mcp_data = json.loads(content)
            return f"✅ MCP v1.0: {mcp_data['result']} (operation: {mcp_data['operation']})"
        else:
            return f"❌ Unexpected response format from MCP v1.0: {result}"
            
    except Exception as e:
        return f"❌ Error calling MCP v1.0: {str(e)}"

@tool  
def sum_three_numbers(a: float, b: float, c: float) -> str:
    """
    Sum three numbers using MCP v1.1 server
    
    Args:
        a: First number to sum
        b: Second number to sum  
        c: Third number to sum
        
    Returns:
        JSON string with the calculation result
    """
    try:
        result = mcp_v11_client.call_tool_sync("sum", {"a": a, "b": b, "c": c})
        
        if "error" in result:
            return f"❌ MCP v1.1 Error: {result['error']}"
            
        # Parse the MCP response
        if result.get("result") and result["result"].get("content"):
            content = result["result"]["content"][0]["text"]
            mcp_data = json.loads(content)
            return f"✅ MCP v1.1: {mcp_data['result']} (operation: {mcp_data['operation']})"
        else:
            return f"❌ Unexpected response format from MCP v1.1: {result}"
            
    except Exception as e:
        return f"❌ Error calling MCP v1.1: {str(e)}"

@tool
def check_mcp_servers_status() -> str:
    """
    Check the status of both MCP servers
    
    Returns:
        Status report of MCP v1.0 and v1.1 servers
    """
    status_report = []
    
    # Test MCP v1.0
    try:
        result_v1 = mcp_v1_client.call_tool_sync("sum", {"a": 1, "b": 1})
        if "error" in result_v1:
            status_report.append("❌ MCP v1.0: Not available")
        else:
            status_report.append("✅ MCP v1.0: Available")
    except:
        status_report.append("❌ MCP v1.0: Connection failed")
    
    # Test MCP v1.1
    try:
        result_v11 = mcp_v11_client.call_tool_sync("sum", {"a": 1, "b": 1, "c": 1})
        if "error" in result_v11:
            status_report.append("❌ MCP v1.1: Not available")
        else:
            status_report.append("✅ MCP v1.1: Available")
    except:
        status_report.append("❌ MCP v1.1: Connection failed")
    
    return "\n".join(status_report)

@tool
def analyze_math_request(request: str) -> str:
    """
    Analyze a mathematical request to determine which MCP version to use
    
    Args:
        request: The user's mathematical request
        
    Returns:
        Analysis indicating which MCP version is appropriate
    """
    import re
    
    # Extract numbers from the request
    numbers = re.findall(r'-?\d+(?:\.\d+)?', request)
    numbers = [float(n) for n in numbers]
    
    if len(numbers) == 2:
        return f"Analysis: Found 2 numbers {numbers}. Use MCP v1.0 for 2-parameter sum."
    elif len(numbers) == 3:
        return f"Analysis: Found 3 numbers {numbers}. Use MCP v1.1 for 3-parameter sum."
    elif len(numbers) < 2:
        return f"Analysis: Found only {len(numbers)} number(s). Need at least 2 numbers for sum operation."
    elif len(numbers) > 3:
        return f"Analysis: Found {len(numbers)} numbers. Current MCP servers only support 2 or 3 number sums."
    else:
        return f"Analysis: Could not determine appropriate MCP version for request: {request}"