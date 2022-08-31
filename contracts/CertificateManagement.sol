// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import '@openzeppelin/contracts/access/AccessControl.sol';

contract CertificateManagement is AccessControl {
    bytes32 public constant ORGANIZATION_ROLE = keccak256('ORGANIZATION_ROLE');
    bytes32 public constant UNIVERSITY_ROLE = keccak256('UNIVERSITY_ROLE');
    bytes32 public constant CERTIFIER_ROLE = keccak256('CERTIFIER_ROLE');

    constructor() {
        _setRoleAdmin(UNIVERSITY_ROLE, ORGANIZATION_ROLE);
        _setRoleAdmin(CERTIFIER_ROLE, UNIVERSITY_ROLE);

        _grantRole(ORGANIZATION_ROLE, msg.sender);
    }

    function addUniversity(address account) public onlyRole(ORGANIZATION_ROLE) {
        _grantRole(UNIVERSITY_ROLE, account);
    }
}
