// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract CertificateManagement is AccessControl, ERC20 {
    bytes32 public constant ORGANIZATION_ROLE = keccak256('ORGANIZATION_ROLE');
    bytes32 public constant UNIVERSITY_ROLE = keccak256('UNIVERSITY_ROLE');
    bytes32 public constant CERTIFIER_ROLE = keccak256('CERTIFIER_ROLE');

    uint256 public constant MAX_ALLOWANCE = 2**256 - 1;

    mapping(address => address) private _certifierToUniversity;

    constructor() ERC20('CToken', 'CTK') {
        _setRoleAdmin(UNIVERSITY_ROLE, ORGANIZATION_ROLE);
        _setRoleAdmin(CERTIFIER_ROLE, UNIVERSITY_ROLE);

        _grantRole(ORGANIZATION_ROLE, msg.sender);
    }

    function addUniversity(address account)
        external
        onlyRole(ORGANIZATION_ROLE)
    {
        _grantRole(UNIVERSITY_ROLE, account);
    }

    function addCertifier(address account) external onlyRole(UNIVERSITY_ROLE) {
        _certifierToUniversity[account] = msg.sender;
        _grantRole(CERTIFIER_ROLE, account);

        approve(account, MAX_ALLOWANCE);
    }

    function removeUniversity(address account)
        external
        onlyRole(ORGANIZATION_ROLE)
    {
        _revokeRole(UNIVERSITY_ROLE, account);
    }

    function removeCertifier(address account)
        external
        onlyRole(UNIVERSITY_ROLE)
    {
        delete _certifierToUniversity[account];
        _revokeRole(CERTIFIER_ROLE, account);

        approve(account, 0);
    }
}
