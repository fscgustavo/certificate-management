// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

error InvalidOrganization(address sender);
error InvalidUniversity(address sender);
error InvalidCertifier(address sender);
error InvalidSuperior(address sender);
error DifferentUniversity(address senderUniversity, address expectedUniversity);

contract CertificateManagement is ERC20 {
    enum CertificateStatus {
        Invalid,
        Valid
    }

    struct University {
        bool active;
        string URI;
    }

    struct Certifier {
        address certifier;
        address university;
    }

    struct Certificate {
        Certifier issuer;
        CertificateStatus status;
        uint256 issueDate;
    }

    uint256 public constant MAX_ALLOWANCE = 2**256 - 1;

    mapping(bytes32 => Certificate) private s_certificates;
    mapping(bytes32 => string) private s_revocationReason;
    mapping(address => bool) private s_organizations;
    mapping(address => University) private s_universities;
    mapping(address => string) private s_universityDiscreditReason;
    mapping(address => string) private s_removedUniversities;
    mapping(address => address) private s_certifierToUniversity;

    modifier onlyOrganization() {
        if (!s_organizations[msg.sender]) {
            revert InvalidOrganization(msg.sender);
        }

        _;
    }

    modifier validUniversity(address university) {
        if (!s_universities[university].active) {
            revert InvalidUniversity(university);
        }

        _;
    }

    modifier onlyCertifierSuperior(address certifier) {
        address adminUniversity = s_certifierToUniversity[certifier];

        if (adminUniversity == address(0x0)) {
            revert InvalidCertifier(certifier);
        }

        bool validOrganization = s_organizations[msg.sender];

        bool isActiveUniversity = s_universities[msg.sender].active;
        bool isSameAdmin = adminUniversity == msg.sender;

        bool validSuperior = validOrganization ||
            (isActiveUniversity && isSameAdmin);

        if (!validSuperior) {
            revert InvalidSuperior(msg.sender);
        }

        _;
    }

    modifier onlyCertifier() {
        if (s_certifierToUniversity[msg.sender] == address(0x0)) {
            revert InvalidCertifier(msg.sender);
        }

        _;
    }

    modifier sameUniversity(
        address senderUniversity,
        address expectedUniversity
    ) {
        if (senderUniversity != expectedUniversity) {
            revert DifferentUniversity(senderUniversity, expectedUniversity);
        }

        _;
    }

    constructor() ERC20('CToken', 'CTK') {
        s_organizations[msg.sender] = true;
    }

    function addOrganization(address account) external onlyOrganization {
        s_organizations[account] = true;
    }

    function removeOrganization(address account) external onlyOrganization {
        delete s_organizations[account];
    }

    function addUniversity(address account, string memory universityURI)
        external
        onlyOrganization
    {
        s_universities[account] = University(true, universityURI);
    }

    function discreditUniversity(address account, string memory reason)
        external
        onlyOrganization
        validUniversity(account)
    {
        s_universities[account].active = false;

        s_universityDiscreditReason[account] = reason;
    }

    function addCertifier(address account)
        external
        validUniversity(msg.sender)
    {
        s_certifierToUniversity[account] = msg.sender;

        approve(account, MAX_ALLOWANCE);
    }

    function removeCertifier(address account)
        external
        onlyCertifierSuperior(account)
    {
        delete s_certifierToUniversity[account];

        approve(account, 0);
    }

    function registerCertificate(bytes32 certificateId, uint256 issueDate)
        external
        onlyCertifier
    {
        address universityAddress = s_certifierToUniversity[msg.sender];

        University memory certifierUniversity = s_universities[
            universityAddress
        ];

        if (!certifierUniversity.active) {
            revert InvalidUniversity(universityAddress);
        }

        s_certificates[certificateId] = Certificate(
            Certifier(msg.sender, universityAddress),
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

    function isOrganization(address account) external view returns (bool) {
        return s_organizations[account];
    }

    function getUniversityOfCertifier(address certifier)
        external
        view
        returns (address)
    {
        return s_certifierToUniversity[certifier];
    }

    function getUniversity(address university)
        external
        view
        returns (University memory)
    {
        return s_universities[university];
    }

    function getUniversityDiscreditReason(address university)
        external
        view
        returns (string memory)
    {
        return s_universityDiscreditReason[university];
    }
}
