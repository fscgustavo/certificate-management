// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

error InvalidOrganization(address sender);
error InvalidUniversity(address sender);
error InvalidCertifier(address sender);
error InvalidSuperior(address sender);
error InvalidRevoker(address sender);
error ExistentCertificate(uint256 issueDate);

contract CertificateManagement is ERC20 {
    struct CertificateStatus {
        bool invalid;
        string description;
    }

    struct University {
        bool active;
        string URI;
    }

    struct Certificate {
        address certifier;
        address university;
        uint256 issueDate;
        uint256 expirationDate;
    }

    struct CompleteCertificate {
        Certificate data;
        CertificateStatus status;
    }

    uint256 public constant MAX_ALLOWANCE = 2**256 - 1;

    mapping(bytes32 => Certificate) private s_certificates;
    mapping(bytes32 => CertificateStatus) private s_revokedCertificates;
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

        bool isSameAdmin = adminUniversity == msg.sender;

        bool validSuperior = validOrganization || isSameAdmin;

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

    modifier onlyNewCertificate(bytes32 certificateId) {
        if (s_certificates[certificateId].issueDate != 0) {
            revert ExistentCertificate(s_certificates[certificateId].issueDate);
        }

        _;
    }

    modifier onlyValidRevoker(bytes32 certificateId) {
        address universityCertificate = s_certificates[certificateId]
            .university;

        bool validOrganizatizon = s_organizations[msg.sender];

        bool isSameAdmin = msg.sender == universityCertificate ||
            universityCertificate == s_certifierToUniversity[msg.sender];

        bool isValidUniversity = s_universities[universityCertificate].active;

        bool validRevoker = validOrganizatizon ||
            (isValidUniversity && isSameAdmin);

        if (!validRevoker) {
            revert InvalidRevoker(msg.sender);
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

    function registerCertificate(
        bytes32 certificateId,
        uint256 issueDate,
        uint256 expirationDate
    ) external onlyCertifier onlyNewCertificate(certificateId) {
        address universityAddress = s_certifierToUniversity[msg.sender];

        University memory certifierUniversity = s_universities[
            universityAddress
        ];

        if (!certifierUniversity.active) {
            revert InvalidUniversity(universityAddress);
        }

        s_certificates[certificateId] = Certificate(
            msg.sender,
            universityAddress,
            issueDate,
            expirationDate
        );
    }

    function revokeCertificate(bytes32 certificateId, string memory reason)
        external
        onlyValidRevoker(certificateId)
    {
        s_revokedCertificates[certificateId] = CertificateStatus(true, reason);
    }

    function verifyCertificate(
        bytes32 certificateId,
        Certificate memory certificate
    ) internal view returns (CertificateStatus memory) {
        CertificateStatus memory revokedCertificate = s_revokedCertificates[
            certificateId
        ];

        bool isExpired = certificate.expirationDate != 0 &&
            block.timestamp >= certificate.expirationDate;

        bool isInvalid = certificate.issueDate == 0 ||
            revokedCertificate.invalid ||
            isExpired;

        string memory description = isExpired
            ? 'Certificado expirado'
            : revokedCertificate.description;

        return CertificateStatus(isInvalid, description);
    }

    function getCertificate(bytes32 certificateId)
        external
        view
        returns (CompleteCertificate memory)
    {
        Certificate memory certificate = s_certificates[certificateId];
        CertificateStatus memory status = verifyCertificate(
            certificateId,
            certificate
        );

        return CompleteCertificate(certificate, status);
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
