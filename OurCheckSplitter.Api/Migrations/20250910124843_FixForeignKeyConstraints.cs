using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OurCheckSplitter.Api.Migrations
{
    /// <inheritdoc />
    public partial class FixForeignKeyConstraints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FriendReceipts_Friends_FriendId",
                table: "FriendReceipts");

            migrationBuilder.DropForeignKey(
                name: "FK_FriendReceipts_Receipts_ReceiptId",
                table: "FriendReceipts");

            migrationBuilder.AddForeignKey(
                name: "FK_FriendReceipts_Friends_FriendId",
                table: "FriendReceipts",
                column: "FriendId",
                principalTable: "Friends",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_FriendReceipts_Receipts_ReceiptId",
                table: "FriendReceipts",
                column: "ReceiptId",
                principalTable: "Receipts",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FriendReceipts_Friends_FriendId",
                table: "FriendReceipts");

            migrationBuilder.DropForeignKey(
                name: "FK_FriendReceipts_Receipts_ReceiptId",
                table: "FriendReceipts");

            migrationBuilder.AddForeignKey(
                name: "FK_FriendReceipts_Friends_FriendId",
                table: "FriendReceipts",
                column: "FriendId",
                principalTable: "Friends",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_FriendReceipts_Receipts_ReceiptId",
                table: "FriendReceipts",
                column: "ReceiptId",
                principalTable: "Receipts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
