using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OurCheckSplitter.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUserIdToFriendAndReceipt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Friends_AppUsers_AppUserId",
                table: "Friends");

            migrationBuilder.DropForeignKey(
                name: "FK_Receipts_AppUsers_AppUserId",
                table: "Receipts");

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

            migrationBuilder.AddColumn<Guid>(
                name: "UserId",
                table: "Receipts",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "UserId",
                table: "Friends",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_Receipts_UserId",
                table: "Receipts",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Friends_UserId",
                table: "Friends",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Friends_AppUsers_UserId",
                table: "Friends",
                column: "UserId",
                principalTable: "AppUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Receipts_AppUsers_UserId",
                table: "Receipts",
                column: "UserId",
                principalTable: "AppUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Friends_AppUsers_UserId",
                table: "Friends");

            migrationBuilder.DropForeignKey(
                name: "FK_Receipts_AppUsers_UserId",
                table: "Receipts");

            migrationBuilder.DropIndex(
                name: "IX_Receipts_UserId",
                table: "Receipts");

            migrationBuilder.DropIndex(
                name: "IX_Friends_UserId",
                table: "Friends");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Receipts");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Friends");

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
    }
}
