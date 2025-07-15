using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OurCheckSplitter.Api.Migrations
{
    /// <inheritdoc />
    public partial class UserEntityAdded2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AppUserId",
                table: "Receipts",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "AppUserId",
                table: "Friends",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AppUsers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Email = table.Column<string>(type: "TEXT", nullable: false),
                    GoogleId = table.Column<string>(type: "TEXT", nullable: true),
                    FirebaseUid = table.Column<string>(type: "TEXT", nullable: true),
                    DisplayName = table.Column<string>(type: "TEXT", nullable: false),
                    ProfilePictureUrl = table.Column<string>(type: "TEXT", nullable: true),
                    PreferredCurrency = table.Column<string>(type: "TEXT", nullable: false),
                    IsPremium = table.Column<bool>(type: "INTEGER", nullable: false),
                    PremiumExpiresAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    VoiceNoteCount = table.Column<int>(type: "INTEGER", nullable: false),
                    ChatbotMessageCount = table.Column<int>(type: "INTEGER", nullable: false),
                    OCRScanCount = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    LastLoginAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppUsers", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Receipts_AppUserId",
                table: "Receipts",
                column: "AppUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Friends_AppUserId",
                table: "Friends",
                column: "AppUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Friends_AppUsers_AppUserId",
                table: "Friends",
                column: "AppUserId",
                principalTable: "AppUsers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Receipts_AppUsers_AppUserId",
                table: "Receipts",
                column: "AppUserId",
                principalTable: "AppUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Friends_AppUsers_AppUserId",
                table: "Friends");

            migrationBuilder.DropForeignKey(
                name: "FK_Receipts_AppUsers_AppUserId",
                table: "Receipts");

            migrationBuilder.DropTable(
                name: "AppUsers");

            migrationBuilder.DropIndex(
                name: "IX_Receipts_AppUserId",
                table: "Receipts");

            migrationBuilder.DropIndex(
                name: "IX_Friends_AppUserId",
                table: "Friends");

            migrationBuilder.DropColumn(
                name: "AppUserId",
                table: "Receipts");

            migrationBuilder.DropColumn(
                name: "AppUserId",
                table: "Friends");
        }
    }
}
