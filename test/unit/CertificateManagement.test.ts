import { developmentChains } from '../../helper-hardhat.config';
import { expect } from 'chai';
import { deployments, ethers, getNamedAccounts, network } from 'hardhat';
import { CertificateManagement } from '../../typechain-types';

const nullAddress = '0x0000000000000000000000000000000000000000';

!developmentChains.has(network.name)
  ? describe.skip
  : describe('Certificate Management Unit Tests', () => {
      let accounts: Record<string, string>;
      let certificateManagement: CertificateManagement;

      beforeEach(async () => {
        const namedAccounts = await getNamedAccounts();

        accounts = namedAccounts;

        await deployments.fixture('all');

        certificateManagement = await ethers.getContract(
          'CertificateManagement',
          namedAccounts.deployer,
        );
      });

      it('was deployed', async () => {
        expect(certificateManagement.address).to.be.a('string');
      });

      it('deployer should have the organization role', async () => {
        const isOrganization = await certificateManagement.isOrganization(
          accounts.deployer,
        );

        expect(isOrganization).to.equal(true);
      });

      describe('Organization Management', () => {
        it('add an organization', async () => {
          await certificateManagement.addOrganization(accounts.organization);

          const isNewOrganization = await certificateManagement.isOrganization(
            accounts.organization,
          );

          expect(isNewOrganization).to.equal(true);
        });

        it('disallow other roles to manage an organization', async () => {
          await certificateManagement.addOrganization(accounts.organization);

          const universityConnection: CertificateManagement =
            await ethers.getContract(
              'CertificateManagement',
              accounts.university,
            );

          await expect(
            universityConnection.addOrganization(accounts.organization),
          ).to.be.revertedWith(`InvalidOrganization("${accounts.university}")`);

          await expect(
            universityConnection.removeOrganization(accounts.organization),
          ).to.be.revertedWith(`InvalidOrganization("${accounts.university}")`);
        });

        it('remove an organization', async () => {
          await certificateManagement.addOrganization(accounts.organization);
          await certificateManagement.removeOrganization(accounts.organization);

          const organizationStatus = await certificateManagement.isOrganization(
            accounts.organization,
          );

          expect(organizationStatus).to.equal(false);
        });
      });

      describe('University Management', () => {
        it('add an university', async () => {
          await certificateManagement.addUniversity(
            accounts.university,
            'random',
          );

          const newUniversity = await certificateManagement.getUniversity(
            accounts.university,
          );

          expect(newUniversity.active).to.equal(true);
          expect(newUniversity.URI).to.equal('random');
        });

        it('discredit an university', async () => {
          await certificateManagement.addUniversity(
            accounts.university,
            'random',
          );

          await certificateManagement.discreditUniversity(
            accounts.university,
            'fraud helper',
          );

          const newUniversity = await certificateManagement.getUniversity(
            accounts.university,
          );

          const discreditReason =
            await certificateManagement.getUniversityDiscreditReason(
              accounts.university,
            );

          expect(newUniversity.active).to.equal(false);
          expect(newUniversity.URI).to.equal('random');
          expect(discreditReason).to.equal('fraud helper');
        });

        it('disallow other roles to manage an university', async () => {
          const universityConnection: CertificateManagement =
            await ethers.getContract(
              'CertificateManagement',
              accounts.university,
            );

          await expect(
            universityConnection.addUniversity(accounts.university, 'random'),
          ).to.be.revertedWith(`InvalidOrganization("${accounts.university}")`);

          await expect(
            universityConnection.discreditUniversity(
              accounts.university,
              'is fake',
            ),
          ).to.be.revertedWith(`InvalidOrganization("${accounts.university}")`);
        });
      });

      describe('Certifier Management', () => {
        let universityConnection: CertificateManagement;

        beforeEach(async () => {
          await certificateManagement.addUniversity(
            accounts.university,
            'random',
          );

          universityConnection = await ethers.getContract(
            'CertificateManagement',
            accounts.university,
          );

          await universityConnection.addCertifier(accounts.certifier);
        });

        it('add a certifier', async () => {
          const certifierUniversity =
            await certificateManagement.getUniversityOfCertifier(
              accounts.certifier,
            );

          expect(certifierUniversity).to.equal(accounts.university);
        });

        it('the certifier should have infinite allowance from his university', async () => {
          const MAX_ALLOWANCE = await certificateManagement.MAX_ALLOWANCE();

          const certifierAllowance = await certificateManagement.allowance(
            accounts.university,
            accounts.certifier,
          );

          expect(certifierAllowance).to.equal(MAX_ALLOWANCE);
        });

        it('remove a certifier', async () => {
          await universityConnection.removeCertifier(accounts.certifier);

          const certifierUniversity =
            await certificateManagement.getUniversityOfCertifier(
              accounts.certifier,
            );

          expect(certifierUniversity).to.equal(nullAddress);
        });

        it('should zero the ex-certifier allowance after the removal', async () => {
          await universityConnection.removeCertifier(accounts.certifier);

          const certifierAllowance = await certificateManagement.allowance(
            accounts.university,
            accounts.certifier,
          );

          expect(certifierAllowance).to.equal(0);
        });

        it('organization can remove certifiers', async () => {
          await certificateManagement.removeCertifier(accounts.certifier);

          const certifierUniversity =
            await certificateManagement.getUniversityOfCertifier(
              accounts.certifier,
            );

          expect(certifierUniversity).to.equal(nullAddress);
        });

        it('can not remove the certifier from other universities', async () => {
          const otherUniversityConnection = await ethers.getContract(
            'CertificateManagement',
            accounts.otherUniversity,
          );

          expect(
            otherUniversityConnection.removeCertifier(accounts.certifier),
          ).to.be.revertedWith(
            `InvalidSuperior("${accounts.otherUniversity}")`,
          );
        });

        it('should revert if a inexistent certifier is passed', async () => {
          await expect(
            universityConnection.removeCertifier(accounts.otherCertifier),
          ).to.be.revertedWith(
            `InvalidCertifier("${accounts.otherCertifier}")`,
          );
        });

        it('invalid universities can not register certifiers', async () => {
          await expect(
            certificateManagement.addCertifier(accounts.certifier),
          ).to.be.revertedWith(`InvalidUniversity("${accounts.deployer}")`);
        });
      });

      describe('Certicate Management', () => {
        let universityConnection: CertificateManagement;
        let certifierConnection: CertificateManagement;
        const certificateId = ethers.utils.id('certificate');
        const issueDate = new Date().getTime();
        const expirationDate = 0;

        beforeEach(async () => {
          await certificateManagement.addUniversity(
            accounts.university,
            'random',
          );

          universityConnection = await ethers.getContract(
            'CertificateManagement',
            accounts.university,
          );

          await universityConnection.addCertifier(accounts.certifier);

          certifierConnection = await ethers.getContract(
            'CertificateManagement',
            accounts.certifier,
          );
        });

        it('certifiers should be able to create certificates', async () => {
          await certifierConnection.registerCertificate(
            certificateId,
            issueDate,
            expirationDate,
          );

          const certificate = await certifierConnection.getCertificate(
            certificateId,
          );

          expect(certificate.data.certifier).to.equal(accounts.certifier);
          expect(certificate.data.university).to.equal(accounts.university);
          expect(certificate.status.revoked).to.equal(false);
          expect(certificate.data.issueDate).to.equal(issueDate);
        });

        it('should not be able to alter the certificate issuer and the issue date', async () => {
          await certifierConnection.registerCertificate(
            certificateId,
            issueDate,
            expirationDate,
          );

          const otherIssueDate = new Date('01/09/2022').getTime();

          await expect(
            certifierConnection.registerCertificate(
              certificateId,
              otherIssueDate,
              expirationDate,
            ),
          ).to.be.revertedWith(`ExistentCertificate(${issueDate})`);
        });

        it('university and organizations can not register certificates', async () => {
          const certificateId = ethers.utils.id('certificate');

          await expect(
            universityConnection.registerCertificate(
              certificateId,
              issueDate,
              expirationDate,
            ),
          ).to.be.revertedWith(`InvalidCertifier("${accounts.university}")`);

          await expect(
            certificateManagement.registerCertificate(
              certificateId,
              issueDate,
              expirationDate,
            ),
          ).to.be.revertedWith(`InvalidCertifier("${accounts.deployer}")`);
        });

        it('certifiers from invalid universities can not register certificates', async () => {
          await certificateManagement.discreditUniversity(
            accounts.university,
            'fraud helper',
          );

          await expect(
            certifierConnection.registerCertificate(
              certificateId,
              issueDate,
              expirationDate,
            ),
          ).to.be.revertedWith(`InvalidUniversity("${accounts.university}")`);
        });

        describe('Revocation', () => {
          const reason = 'Ilegal process';

          beforeEach(async () => {
            await certifierConnection.registerCertificate(
              certificateId,
              issueDate,
              expirationDate,
            );
          });

          it('certifiers should be able to revoke certificates', async () => {
            await certifierConnection.revokeCertificate(certificateId, reason);

            const certificate = await certifierConnection.getCertificate(
              certificateId,
            );

            expect(certificate.data.certifier).to.equal(accounts.certifier);
            expect(certificate.data.university).to.equal(accounts.university);
            expect(certificate.data.issueDate).to.equal(issueDate);
            expect(certificate.status.revoked).to.equal(true);
            expect(certificate.status.description).to.equal(reason);
          });

          it('organizations should be able to remove certificates', async () => {
            await certificateManagement.revokeCertificate(
              certificateId,
              'Processo ilícito',
            );

            const certificate = await certifierConnection.getCertificate(
              certificateId,
            );

            expect(certificate.status.revoked).to.equal(true);
          });

          it('issuer university should be able to remove certificates', async () => {
            await universityConnection.revokeCertificate(
              certificateId,
              'Processo ilícito',
            );

            const certificate = await certifierConnection.getCertificate(
              certificateId,
            );

            expect(certificate.status.revoked).to.equal(true);
          });

          it('other universities can not revoke certificates not issued by them', async () => {
            const otherUniversityConnection: CertificateManagement =
              await ethers.getContract(
                'CertificateManagement',
                accounts.otherUniversity,
              );

            await expect(
              otherUniversityConnection.revokeCertificate(
                certificateId,
                'Processo ilícito',
              ),
            ).to.be.revertedWith(
              `InvalidRevoker("${accounts.otherUniversity}")`,
            );
          });

          it('other certifier can not revoke a certificate from other university', async () => {
            await certificateManagement.addUniversity(
              accounts.otherUniversity,
              'random',
            );

            const otherUniversityConnection: CertificateManagement =
              await ethers.getContract(
                'CertificateManagement',
                accounts.otherUniversity,
              );

            await otherUniversityConnection.addCertifier(
              accounts.otherUniversity,
            );

            const otherCertifierConnection: CertificateManagement =
              await ethers.getContract(
                'CertificateManagement',
                accounts.otherCertifier,
              );

            await expect(
              otherCertifierConnection.revokeCertificate(
                certificateId,
                'Processo ilícito',
              ),
            ).to.be.revertedWith(
              `InvalidRevoker("${accounts.otherCertifier}")`,
            );
          });

          it('should be invalid if the expiration date is in the past');
        });
      });
    });
