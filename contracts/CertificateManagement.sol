// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract CertificateManagement is AccessControl, ERC20 {
    enum CertificateStatus {
        Invalid,
        Valid
    }

    struct Certifier {
        address certifier;
        address university;
        string informationURI;
    }

    struct Certificate {
        Certifier issuer;
        CertificateStatus status;
        uint256 issueDate;
    }

    bytes32 public constant ORGANIZATION_ROLE = keccak256('ORGANIZATION_ROLE');
    bytes32 public constant UNIVERSITY_ROLE = keccak256('UNIVERSITY_ROLE');
    bytes32 public constant CERTIFIER_ROLE = keccak256('CERTIFIER_ROLE');
    uint256 public constant MAX_ALLOWANCE = 2**256 - 1;

    mapping(address => address) private s_certifierToUniversity;
    mapping(bytes32 => Certificate) private s_certificates;
    mapping(bytes32 => string) private s_revocationReason;
    mapping(address => string) private s_universityURI;

    constructor() ERC20('CToken', 'CTK') {
        _setRoleAdmin(UNIVERSITY_ROLE, ORGANIZATION_ROLE);
        _setRoleAdmin(CERTIFIER_ROLE, UNIVERSITY_ROLE);

        _grantRole(ORGANIZATION_ROLE, msg.sender);
    }

    function addUniversity(address account, string memory universityURI)
        external
        onlyRole(ORGANIZATION_ROLE)
    {
        _grantRole(UNIVERSITY_ROLE, account);
        s_universityURI[account] = universityURI;
    }

    function addCertifier(address account) external onlyRole(UNIVERSITY_ROLE) {
        s_certifierToUniversity[account] = msg.sender;
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
        delete s_certifierToUniversity[account];
        _revokeRole(CERTIFIER_ROLE, account);

        approve(account, 0);
    }

    function registerCertificate(bytes32 certificateId, uint256 issueDate)
        external
        onlyRole(CERTIFIER_ROLE)
    {
        address university = s_certifierToUniversity[msg.sender];

        s_certificates[certificateId] = Certificate(
            Certifier(msg.sender, university, s_universityURI[university]),
            CertificateStatus.Valid,
            issueDate
        );
    }

    function getCertificate(bytes32 certificateId)
        external
        view
        returns (Certificate memory)
    {
        return s_certificates[certificateId];
    }

    function getRevocationReason(bytes32 certificateId)
        external
        view
        returns (string memory)
    {
        return s_revocationReason[certificateId];
    }

    function getUniversityOfCertifier(address certifier)
        external
        view
        returns (address)
    {
        return s_certifierToUniversity[certifier];
    }

    function getUniversityURI(address university)
        external
        view
        returns (string memory)
    {
        return s_universityURI[university];
    }
}
