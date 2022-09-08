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

          expect(newUniversity.active).to.equal(false);
          expect(newUniversity.URI).to.equal('random');
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

        it('can not remove the certifier from other universites', async () => {
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
      });
    });
